import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { EdgeEntity } from '@application/entities/edge.entity';
import { NodeEntity } from '@application/entities/node.entity';
import { GenerationStatusEnum } from '@application/entities/node-enums';
import { CreditDebitService } from '@application/services/credit-debit.service';
import { NodeValidationService } from '@application/services/node-validation.service';
import { EdgeDynamoRepository } from '@infra/database/dynamo/repositories/edge-dynamo.repository';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
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
    private readonly nodeRepository: NodeDynamoRepository,
    private readonly imageGatewayAI: ImageGatewayAI,
    private readonly edgeRepository: EdgeDynamoRepository,
    private readonly creditDebitService: CreditDebitService,
    private readonly nodeValidationService: NodeValidationService,
  ) {}

  async execute(params: ProcessImageAIUseCaseInput): Promise<void> {
    const { flowId, nodeGeneratorId, inputs, accountId } = params;

    const nodes = await this.nodeRepository.findNodesByIds({
      flowId,
      nodeIds: inputs.concat(nodeGeneratorId),
    });

    const rawNodeGenerator = nodes.find((node) => node.attrs.id === nodeGeneratorId);
    const nodeGenerator = this.nodeValidationService.validateGeneratorNode(rawNodeGenerator);

    const promptNode = this.nodeValidationService.findPromptNode(nodes);
    const imageNodes = this.nodeValidationService.findImageNodes(nodes);

    try {
      await this.processImageGeneration(flowId, nodeGenerator, promptNode, imageNodes, accountId);
    } catch (error) {
      await this.handleProcessingError(nodeGenerator, error);
    }
  }

  private async processImageGeneration(
    flowId: string,
    nodeGenerator: NodeEntity,
    promptNode: NodeEntity,
    imageNodes: NodeEntity[],
    accountId: string,
  ): Promise<void> {
    const nodeDataPrompt = promptNode.attrs.data as NodeEntity.PromptNodeData;
    const nodeDataGenerator = nodeGenerator.attrs.data as NodeEntity.GenerationImageNodeData;

    const imagesData = imageNodes.map((image) => {
      const nodeData = image.attrs.data as NodeEntity.FileNodeData;
      return {
        key: nodeData.key as string,
      };
    });

    await this.updateNodeStatus(
      nodeGenerator,
      GenerationStatusEnum.PROCESSING,
      (nodeDataGenerator.attempts || 0) + 1,
    );

    const { key, usage } = await this.imageGatewayAI.processImage({
      images: imagesData,
      prompt: nodeDataPrompt.prompt || '',
      parameters: nodeDataGenerator.parameters,
      accountId,
      flowId,
    });

    await this.updateNodeStatus(nodeGenerator, GenerationStatusEnum.COMPLETED);

    const consumedCredits = calculateExactCreditsFromUsage(usage);

    await this.creditDebitService.debitAccount(accountId, consumedCredits);

    nodeGenerator.updateAttributes({
      data: {
        ...nodeGenerator.attrs.data,
        totalTokens: usage.totalTokenCount,
        consumedCredits,
      } as NodeEntity.NodeData,
    });

    await this.nodeRepository.update(nodeGenerator);

    const resultNode = await this.createOrUpdateResultNode(
      flowId,
      nodeGenerator,
      nodeDataGenerator,
      key,
    );

    await this.saveResultsAndCreateEdge(flowId, nodeGenerator, resultNode);
  }

  private async updateNodeStatus(
    nodeGenerator: NodeEntity,
    status: GenerationStatusEnum,
    attempts?: number,
  ): Promise<void> {
    const currentData = nodeGenerator.attrs.data as NodeEntity.GenerationImageNodeData;

    nodeGenerator.updateAttributes({
      data: {
        ...currentData,
        status,
        ...(attempts !== undefined && {
          attempts,
        }),
      } as NodeEntity.NodeData,
    });

    await this.nodeRepository.update(nodeGenerator);
  }

  private async createOrUpdateResultNode(
    flowId: string,
    nodeGenerator: NodeEntity,
    nodeDataGenerator: NodeEntity.GenerationImageNodeData,
    imageKey: string,
  ): Promise<NodeEntity> {
    if (nodeDataGenerator.outputNodeId) {
      const existingNode = await this.nodeRepository.findById(
        nodeDataGenerator.outputNodeId,
        flowId,
      );

      if (existingNode) {
        existingNode.updateAttributes({
          data: {
            type: NodeEntity.NodeType.RESULT_IMAGE,
            key: imageKey,
            inputType: 'IMAGE',
            totalTokens: GeminiPricing.inputImageTokens,
          } as NodeEntity.NodeData,
          isExecuted: true,
        });

        await this.nodeRepository.update(existingNode);
        return existingNode;
      }
    }

    return new NodeEntity({
      flowId,
      position: {
        x: nodeGenerator.attrs.position.x + RESULT_NODE_OFFSET_X,
        y: nodeGenerator.attrs.position.y,
      },
      data: {
        type: NodeEntity.NodeType.RESULT_IMAGE,
        key: imageKey,
        inputType: 'IMAGE',
        totalTokens: GeminiPricing.inputImageTokens,
      } as NodeEntity.NodeData,
      isExecuted: false,
    });
  }

  private async saveResultsAndCreateEdge(
    flowId: string,
    nodeGenerator: NodeEntity,
    resultNode: NodeEntity,
  ): Promise<void> {
    const edge = new EdgeEntity({
      flowId,
      sourceNodeId: nodeGenerator.attrs.id,
      targetNodeId: resultNode.attrs.id,
    });

    const saveOperations = [
      this.edgeRepository.save(edge),
    ];

    if (!resultNode.attrs.isExecuted) {
      saveOperations.push(this.nodeRepository.save(resultNode));
    }

    await Promise.all(saveOperations);
  }

  private async handleProcessingError(nodeGenerator: NodeEntity, error: unknown): Promise<void> {
    if (nodeGenerator.attrs.data.type !== NodeEntity.NodeType.GENERATION_IMAGE) {
    }

    const currentData = nodeGenerator.attrs.data as NodeEntity.GenerationImageNodeData;
    const shouldFail = currentData.attempts && currentData.attempts >= MAX_ATTEMPTS;
    const newStatus = shouldFail ? GenerationStatusEnum.FAILED : GenerationStatusEnum.QUEUED;

    await this.updateNodeStatus(nodeGenerator, newStatus);

    throw error;
  }
}
