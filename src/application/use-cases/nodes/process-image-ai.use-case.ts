import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { EdgeEntity } from '@application/entities/edge.entity';
import { NodeEntity } from '@application/entities/node.entity';
import { GenerationStatusEnum } from '@application/entities/node-enums';
import { CreditService } from '@application/services/credit.service';
import { NodeValidationService } from '@application/services/node-validation.service';
import { EdgeDrizzleRepository } from '@infra/database/drizzle/repositories/edge-drizzle.repository';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { ImageGatewayAI } from '@infra/gateways/ai/image-ai.gateway';
import { GeminiPricing } from '@shared/config/gemini-pricing';
import { Injectable } from 'src/kernel/decorators/injectable';
import { calculateExactCreditsFromUsage } from 'src/shared/utils/credit-calculator';

const MAX_ATTEMPTS = 3;
const RESULT_NODE_OFFSET_X = 400;

interface ProcessImageAIUseCaseInput {
  flowId: string;
  nodeGeneratorId: string;
  inputs: string[];
  accountId: string;
}

@Injectable()
export class ProcessImageAIUseCase implements IUseCase<ProcessImageAIUseCaseInput, void> {
  constructor(
    private readonly nodeRepository: NodeDrizzleRepository,
    private readonly imageGatewayAI: ImageGatewayAI,
    private readonly edgeRepository: EdgeDrizzleRepository,
    private readonly creditService: CreditService,
    private readonly nodeValidationService: NodeValidationService,
  ) {}

  async execute(params: ProcessImageAIUseCaseInput): Promise<void> {
    const { flowId, nodeGeneratorId, inputs, accountId } = params;

    const nodes = await this.nodeRepository.findNodesByIds({
      flowId,
      nodeIds: inputs.concat(nodeGeneratorId),
    });

    const rawNodeGenerator = nodes.find((node) => node.attrs.id === nodeGeneratorId);
    const generator = this.nodeValidationService.validateGeneratorNode(rawNodeGenerator);
    const promptNode = this.nodeValidationService.findPromptNode(nodes);
    const imageNodes = this.nodeValidationService.findImageNodes(nodes);

    try {
      await this.generate(flowId, generator, promptNode, imageNodes, accountId);
    } catch (error) {
      await this.handleError(generator, error);
    }
  }

  private async generate(
    flowId: string,
    generator: NodeEntity,
    promptNode: NodeEntity | undefined,
    imageNodes: NodeEntity[],
    accountId: string,
  ): Promise<void> {
    if (!generator.isGeneration()) return;

    const genData = generator.attrs.data;

    await this.updateStatus(generator, GenerationStatusEnum.PROCESSING, genData.attempts + 1);

    const images: { key: string }[] = [];
    for (const n of imageNodes) {
      if (n.isImage() && n.attrs.data.key) {
        images.push({ key: n.attrs.data.key });
      }
    }

    const { key, usage } = await this.imageGatewayAI.processImage({
      images,
      prompt: promptNode?.isPrompt() ? promptNode.attrs.data.prompt : '',
      parameters: { aspectRatio: genData.aspectRatio, quality: genData.quality },
      accountId,
      flowId,
    });

    await this.updateStatus(generator, GenerationStatusEnum.COMPLETED);

    const consumedCredits = calculateExactCreditsFromUsage(usage);
    await this.creditService.debitAccount(accountId, consumedCredits);

    generator.updateAttributes({
      totalTokens: usage.totalTokenCount,
      consumedCredits,
    });
    await this.nodeRepository.update(generator);

    const resultNode = await this.getOrCreateResultNode(flowId, generator, genData, key);
    await this.saveResultAndEdge(flowId, generator, resultNode);
  }

  private async updateStatus(
    generator: NodeEntity,
    status: GenerationStatusEnum,
    attempts?: number,
  ): Promise<void> {
    if (!generator.isGeneration()) return;

    generator.updateAttributes({
      data: {
        ...generator.attrs.data,
        status,
        ...(attempts !== undefined && { attempts }),
      },
    });

    await this.nodeRepository.update(generator);
  }

  private async getOrCreateResultNode(
    flowId: string,
    generator: NodeEntity,
    genData: NodeEntity.GenerationData,
    imageKey: string,
  ): Promise<NodeEntity> {
    const resultData = {
      key: imageKey,
      inputType: 'IMAGE' as const,
    };

    if (genData.outputNodeId) {
      const existing = await this.nodeRepository.findById(genData.outputNodeId, flowId);

      if (existing) {
        existing.updateAttributes({
          totalTokens: GeminiPricing.inputImageTokens,
          data: resultData,
          isExecuted: true,
        });
        await this.nodeRepository.update(existing);
        return existing;
      }
    }

    return new NodeEntity({
      flowId,
      nodeType: NodeEntity.NodeType.RESULT_IMAGE,
      position: {
        x: generator.attrs.position.x + RESULT_NODE_OFFSET_X,
        y: generator.attrs.position.y,
      },
      totalTokens: GeminiPricing.inputImageTokens,
      data: resultData,
      isExecuted: false,
    });
  }

  private async saveResultAndEdge(
    flowId: string,
    generator: NodeEntity,
    resultNode: NodeEntity,
  ): Promise<void> {
    const edge = new EdgeEntity({
      flowId,
      sourceNodeId: generator.attrs.id,
      targetNodeId: resultNode.attrs.id,
    });

    const operations: Promise<void>[] = [this.edgeRepository.save(edge)];

    if (!resultNode.attrs.isExecuted) {
      operations.push(this.nodeRepository.save(resultNode));
    }

    await Promise.all(operations);
  }

  private async handleError(generator: NodeEntity, error: unknown): Promise<never> {
    if (generator.isGeneration()) {
      const shouldFail = generator.attrs.data.attempts >= MAX_ATTEMPTS;
      const newStatus = shouldFail ? GenerationStatusEnum.FAILED : GenerationStatusEnum.QUEUED;
      await this.updateStatus(generator, newStatus);
    }

    throw error;
  }
}
