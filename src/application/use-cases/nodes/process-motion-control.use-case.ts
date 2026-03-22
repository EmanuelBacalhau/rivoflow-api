import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { EdgeEntity } from '@application/entities/edge.entity';
import { NodeEntity } from '@application/entities/node.entity';
import { GenerationStatusEnum } from '@application/entities/node-enums';
import { CreditService } from '@application/services/credit.service';
import { NodeValidationService } from '@application/services/node-validation.service';
import { EdgeDrizzleRepository } from '@infra/database/drizzle/repositories/edge-drizzle.repository';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { MotionControlGatewayAI } from '@infra/gateways/ai/motion-control-ai.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';
import { calculateCreditsFromCost } from 'src/shared/utils/credit-calculator';

const MAX_ATTEMPTS = 3;
const RESULT_NODE_OFFSET_X = 400;

interface ProcessMotionControlInput {
  flowId: string;
  nodeGeneratorId: string;
  inputs: string[];
  accountId: string;
}

@Injectable()
export class ProcessMotionControlUseCase implements IUseCase<ProcessMotionControlInput, void> {
  constructor(
    private readonly nodeRepository: NodeDrizzleRepository,
    private readonly motionControlGateway: MotionControlGatewayAI,
    private readonly edgeRepository: EdgeDrizzleRepository,
    private readonly creditService: CreditService,
    private readonly nodeValidationService: NodeValidationService,
  ) {}

  async execute(params: ProcessMotionControlInput): Promise<void> {
    const { flowId, nodeGeneratorId, inputs, accountId } = params;

    const nodes = await this.nodeRepository.findNodesByIds({
      flowId,
      nodeIds: inputs.concat(nodeGeneratorId),
    });

    const rawGenerator = nodes.find((n) => n.attrs.id === nodeGeneratorId);
    if (!rawGenerator || !rawGenerator.isMotionControl()) return;

    const generator = rawGenerator;
    const imageNodes = this.nodeValidationService.findImageNodes(nodes);
    const videoNodes = nodes.filter((n) => n.isVideo() && n.getVideoKey());
    const promptNode = this.nodeValidationService.findPromptNode(nodes);

    try {
      const genData = generator.attrs.data;

      this.updateGeneratorStatus(generator, GenerationStatusEnum.PROCESSING, genData.attempts + 1);
      await this.nodeRepository.update(generator);

      const imageNode = imageNodes.find((n) => n.isImage() && n.attrs.data.key);
      if (!imageNode || !imageNode.isImage() || !imageNode.attrs.data.key) {
        throw new Error('No valid image node found for motion control');
      }

      const videoNode = videoNodes[0];
      const videoKey = videoNode?.getVideoKey();
      if (!videoNode || !videoKey) {
        throw new Error('No valid video node found for motion control');
      }

      const prompt = promptNode?.isPrompt() ? promptNode.attrs.data.prompt : '';

      const { key, costUsd } = await this.motionControlGateway.process({
        imageKey: imageNode.attrs.data.key,
        videoKey,
        characterOrientation: genData.characterOrientation,
        keepOriginalSound: genData.keepOriginalSound,
        prompt,
        accountId,
        flowId,
      });

      this.updateGeneratorStatus(generator, GenerationStatusEnum.COMPLETED);
      const consumedCredits = calculateCreditsFromCost(costUsd);
      generator.updateAttributes({
        data: {
          ...generator.attrs.data,
          consumedCredits,
        },
      });
      await this.nodeRepository.update(generator);

      await this.creditService.debitAccount(accountId, consumedCredits);

      const resultNode = await this.getOrCreateResultNode(flowId, generator, genData, key);
      await this.saveResultAndEdge(flowId, generator, resultNode);
    } catch (error) {
      const genData = generator.attrs.data;
      const shouldFail = genData.attempts >= MAX_ATTEMPTS;
      this.updateGeneratorStatus(
        generator,
        shouldFail ? GenerationStatusEnum.FAILED : GenerationStatusEnum.QUEUED,
      );
      await this.nodeRepository.update(generator);
      throw error;
    }
  }

  private updateGeneratorStatus(
    generator: NodeEntity,
    status: GenerationStatusEnum,
    attempts?: number,
  ): void {
    if (!generator.isMotionControl()) return;
    generator.updateAttributes({
      data: {
        ...generator.attrs.data,
        status,
        ...(attempts !== undefined && {
          attempts,
        }),
      },
    });
  }

  private async getOrCreateResultNode(
    flowId: string,
    generator: NodeEntity,
    genData: NodeEntity.MotionControlData,
    videoKey: string,
  ): Promise<NodeEntity> {
    const resultData: NodeEntity.FileData = {
      key: videoKey,
    };

    if (genData.outputNodeId) {
      const existing = await this.nodeRepository.findById(genData.outputNodeId, flowId);
      if (existing) {
        existing.updateAttributes({
          data: resultData,
          isExecuted: true,
        });
        await this.nodeRepository.update(existing);
        return existing;
      }
    }

    return new NodeEntity({
      flowId,
      nodeType: NodeEntity.NodeType.RESULT_VIDEO,
      position: {
        x: generator.attrs.position.x + RESULT_NODE_OFFSET_X,
        y: generator.attrs.position.y,
      },
      data: resultData,
      isExecuted: false,
    });
  }

  private async saveResultAndEdge(
    flowId: string,
    generator: NodeEntity,
    resultNode: NodeEntity,
  ): Promise<void> {
    if (!resultNode.attrs.isExecuted) {
      await this.nodeRepository.save(resultNode);
    }
    await this.edgeRepository.save(
      new EdgeEntity({
        flowId,
        sourceNodeId: generator.attrs.id,
        targetNodeId: resultNode.attrs.id,
      }),
    );
  }
}
