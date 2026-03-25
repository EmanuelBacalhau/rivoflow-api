import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { AccountTransactionEntity } from '@application/entities/account-transaction.entity';
import { NodeEntity } from '@application/entities/node.entity';
import { GenerationStatusEnum } from '@application/entities/node-enums';
import { CreditService } from '@application/services/credit.service';
import { DrizzleTransaction } from '@infra/database/drizzle/drizzle-transaction';
import { AccountTransactionDrizzleRepository } from '@infra/database/drizzle/repositories/account-transaction-drizzle.repository';
import { EdgeDrizzleRepository } from '@infra/database/drizzle/repositories/edge-drizzle.repository';
import { FlowDrizzleRepository } from '@infra/database/drizzle/repositories/flow-drizzle.repository';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { ImageGatewayAI } from '@infra/gateways/ai/image-ai.gateway';
import { ImageToVideoGatewayAI } from '@infra/gateways/ai/image-to-video-ai.gateway';
import { MotionControlGatewayAI } from '@infra/gateways/ai/motion-control-ai.gateway';
import { RemoveBgGatewayAI } from '@infra/gateways/ai/remove-bg-ai.gateway';
import { TextToImageGatewayAI } from '@infra/gateways/ai/text-to-image-ai.gateway';
import { UpscaleGatewayAI } from '@infra/gateways/ai/upscale-ai.gateway';
import { EdgeEntity } from '@application/entities/edge.entity';
import { Injectable } from 'src/kernel/decorators/injectable';
import { CreditPricing } from 'src/shared/config/credit-pricing';
import { calculateCreditsFromCost } from 'src/shared/utils/credit-calculator';

const RESULT_NODE_OFFSET_X = 400;

interface FalWebhookInput {
  requestId: string;
  status: 'OK' | 'ERROR';
  payload?: Record<string, unknown>;
  error?: string;
}

@Injectable()
export class FalWebhookUseCase implements IUseCase<FalWebhookInput, void> {
  constructor(
    private readonly nodeRepository: NodeDrizzleRepository,
    private readonly flowRepository: FlowDrizzleRepository,
    private readonly edgeRepository: EdgeDrizzleRepository,
    private readonly transactionRepository: AccountTransactionDrizzleRepository,
    private readonly transactWrite: DrizzleTransaction,
    private readonly creditService: CreditService,
    private readonly imageGateway: ImageGatewayAI,
    private readonly textToImageGateway: TextToImageGatewayAI,
    private readonly upscaleGateway: UpscaleGatewayAI,
    private readonly removeBgGateway: RemoveBgGatewayAI,
    private readonly imageToVideoGateway: ImageToVideoGatewayAI,
    private readonly motionControlGateway: MotionControlGatewayAI,
  ) {}

  async execute(params: FalWebhookInput): Promise<void> {
    console.info('FAL WEBHOOK USE CASE: looking up requestId', params.requestId);

    const generator = await this.nodeRepository.findByFalRequestId(params.requestId);
    if (!generator) {
      console.warn('FAL WEBHOOK: no generator found for requestId', params.requestId);
      return;
    }

    console.info('FAL WEBHOOK: found generator', generator.attrs.id, generator.attrs.nodeType);

    if (!generator.isAnyGeneration()) {
      console.warn('FAL WEBHOOK: node is not a generation type', generator.attrs.nodeType);
      return;
    }

    const genData = generator.attrs.data as { status: GenerationStatusEnum; falRequestId?: string };
    if (genData.status === GenerationStatusEnum.COMPLETED || genData.status === GenerationStatusEnum.FAILED) {
      console.info('FAL WEBHOOK: node already', genData.status, '- skipping');
      return;
    }

    if (params.status === 'ERROR') {
      this.setStatus(generator, GenerationStatusEnum.FAILED);
      await this.nodeRepository.update(generator);
      return;
    }

    const flow = await this.flowRepository.findById(generator.attrs.flowId);
    if (!flow) return;

    const accountId = flow.attrs.accountId;
    const flowId = generator.attrs.flowId;

    try {
      const result = await this.processResult(generator, params.payload ?? {}, accountId, flowId);

      const resultNodeType = this.isVideoResult(generator)
        ? NodeEntity.NodeType.RESULT_VIDEO
        : NodeEntity.NodeType.RESULT_IMAGE;

      const resultData: NodeEntity.FileData = {
        key: result.key,
        inputType: resultNodeType === NodeEntity.NodeType.RESULT_VIDEO ? 'VIDEO' : 'IMAGE',
        duration: result.duration,
        fps: result.fps,
      };

      const markup = this.isVideoResult(generator)
        ? CreditPricing.videoMarkupMultiplier
        : undefined;
      const consumedCredits = calculateCreditsFromCost(result.costUsd, markup);

      await this.transactWrite.execute(async (tx) => {
        this.setStatus(generator, GenerationStatusEnum.COMPLETED);
        this.setConsumedCredits(generator, consumedCredits);
        await this.nodeRepository.update(generator, tx);

        await this.creditService.debitAccount(accountId, consumedCredits, tx);

        await this.transactionRepository.save(
          new AccountTransactionEntity({
            accountId,
            type: AccountTransactionEntity.Type.DEBIT,
            credits: consumedCredits,
            metadata: {
              nodeId: generator.attrs.id,
              nodeType: generator.attrs.nodeType,
              flowId,
              costUsd: result.costUsd,
            },
          }),
          tx,
        );

        const existingOutputNodeId = (generator.attrs.data as any).outputNodeId;
        let resultNode: NodeEntity;

        if (existingOutputNodeId) {
          const existing = await this.nodeRepository.findById(existingOutputNodeId, flowId);
          if (existing) {
            existing.updateAttributes({ data: resultData, isExecuted: true });
            await this.nodeRepository.update(existing, tx);
            resultNode = existing;
          } else {
            resultNode = this.createResultNode(flowId, generator, resultNodeType, resultData);
            await this.nodeRepository.save(resultNode, tx);
          }
        } else {
          resultNode = this.createResultNode(flowId, generator, resultNodeType, resultData);
          await this.nodeRepository.save(resultNode, tx);
        }

        await this.edgeRepository.save(new EdgeEntity({
          flowId,
          sourceNodeId: generator.attrs.id,
          targetNodeId: resultNode.attrs.id,
        }));
      });
    } catch (error) {
      this.setStatus(generator, GenerationStatusEnum.FAILED);
      await this.nodeRepository.update(generator);
      throw error;
    }
  }

  private async processResult(
    generator: NodeEntity,
    payload: Record<string, unknown>,
    accountId: string,
    flowId: string,
  ): Promise<{ key: string; costUsd: number; duration?: number; fps?: number }> {
    if (generator.isGeneration()) {
      const { key, costUsd } = await this.imageGateway.completeFromWebhook(
        payload as any,
        accountId,
        flowId,
        generator.attrs.data.quality,
      );
      return { key, costUsd };
    }

    if (generator.isTextToImage()) {
      const { key, costUsd } = await this.textToImageGateway.completeFromWebhook(
        payload as any,
        accountId,
        flowId,
        generator.attrs.data.quality,
      );
      return { key, costUsd };
    }

    if (generator.isUpscale()) {
      const { key, costUsd } = await this.upscaleGateway.completeFromWebhook(payload as any, accountId, flowId);
      return { key, costUsd };
    }

    if (generator.isRemoveBg()) {
      const { key, costUsd } = await this.removeBgGateway.completeFromWebhook(payload as any, accountId, flowId);
      return { key, costUsd };
    }

    if (generator.isImageToVideo()) {
      const { key, costUsd, duration, fps } = await this.imageToVideoGateway.completeFromWebhook(
        payload as any,
        accountId,
        flowId,
        generator.attrs.data.tier,
        generator.attrs.data.duration,
      );
      return { key, costUsd, duration, fps };
    }

    if (generator.isMotionControl()) {
      const { key, costUsd } = await this.motionControlGateway.completeFromWebhook(payload as any, accountId, flowId);
      return { key, costUsd };
    }

    throw new Error('Unknown generator node type');
  }

  private isVideoResult(generator: NodeEntity): boolean {
    return generator.isImageToVideo() || generator.isMotionControl();
  }

  private setStatus(generator: NodeEntity, status: GenerationStatusEnum): void {
    generator.updateAttributes({
      data: { ...generator.attrs.data, status } as any,
    });
  }

  private setConsumedCredits(generator: NodeEntity, consumedCredits: number): void {
    generator.updateAttributes({
      data: { ...generator.attrs.data, consumedCredits } as any,
    });
  }

  private createResultNode(
    flowId: string,
    generator: NodeEntity,
    nodeType: NodeEntity.NodeType,
    data: NodeEntity.FileData,
  ): NodeEntity {
    return new NodeEntity({
      flowId,
      nodeType,
      position: { x: generator.attrs.position.x + RESULT_NODE_OFFSET_X, y: generator.attrs.position.y },
      data,
      isExecuted: false,
    });
  }
}
