import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { EdgeEntity } from '@application/entities/edge.entity';
import { NodeEntity } from '@application/entities/node.entity';
import { InvalidNodeTypeError } from '@application/errors/application/invalid-node-type.error';
import { NodeAlreadyProcessedError } from '@application/errors/application/node-already-processed.error';
import { NodeAlreadyProcessingError } from '@application/errors/application/node-already-processing.error';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { EdgeDynamoRepository } from '@infra/database/dynamo/repositories/edge-dynamo.repository';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { ImageGatewayAI } from '@infra/gateways/ai/image-ai.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

const MAX_ATTEMPTS = 3;
const RESULT_NODE_OFFSET_X = 400;

interface ProcessImageAIUseCaseInput {
  flowId: string;
  nodeGeneratorId: string;
  inputs: string[];
}

@Injectable()
export class ProcessImageAIUseCase implements IUseCase<ProcessImageAIUseCaseInput, void> {
  constructor(
    private readonly nodeRepository: NodeDynamoRepository,
    private readonly imageGatewayAI: ImageGatewayAI,
    private readonly edgeRepository: EdgeDynamoRepository,
  ) {}

  async execute(params: ProcessImageAIUseCaseInput): Promise<void> {
    const { flowId, nodeGeneratorId, inputs } = params;

    const nodes = await this.nodeRepository.findNodesByIds({
      flowId,
      nodeIds: inputs.concat(nodeGeneratorId),
    });

    const nodeGenerator = this.findNodeGenerator(nodes, nodeGeneratorId);
    this.validateNodeGeneratorStatus(nodeGenerator);

    const promptNode = this.findPromptNode(nodes);
    const imageNodes = this.findImageNodes(nodes);

    try {
      await this.processImageGeneration(flowId, nodeGenerator, promptNode, imageNodes);
    } catch (error) {
      await this.handleProcessingError(nodeGenerator, error);
    }
  }

  private findNodeGenerator(nodes: NodeEntity[], nodeGeneratorId: string): NodeEntity {
    const nodeGenerator = nodes.find((node) => node.attrs.id === nodeGeneratorId);

    if (!nodeGenerator) {
      throw new ResourceNotFoundError('Generator node not found');
    }

    return nodeGenerator;
  }

  private validateNodeGeneratorStatus(nodeGenerator: NodeEntity): void {
    if (nodeGenerator.attrs.data.type !== NodeEntity.NodeType.GENERATION_IMAGE) {
      throw new InvalidNodeTypeError('Invalid node type for image generation');
    }

    const status = nodeGenerator.attrs.data.status;

    if (status === NodeEntity.GenerationStatusEnum.PROCESSING) {
      throw new NodeAlreadyProcessingError('Node is already being processed');
    }

    if (status === NodeEntity.GenerationStatusEnum.COMPLETED) {
      throw new NodeAlreadyProcessedError('Node has already been processed');
    }
  }

  private findPromptNode(nodes: NodeEntity[]): NodeEntity {
    const promptNode = nodes.find((node) => node.attrs.data.type === NodeEntity.NodeType.PROMPT);

    if (!promptNode) {
      throw new ResourceNotFoundError('Prompt node not found');
    }

    return promptNode;
  }

  private findImageNodes(nodes: NodeEntity[]): NodeEntity[] {
    return nodes.filter((node) => 'key' in node.attrs.data);
  }

  private async processImageGeneration(
    flowId: string,
    nodeGenerator: NodeEntity,
    promptNode: NodeEntity,
    imageNodes: NodeEntity[],
  ): Promise<void> {
    const nodeDataPrompt = promptNode.attrs.data as NodeEntity.NodeDataPrompt;
    const nodeDataGenerator = nodeGenerator.attrs.data as NodeEntity.NodeDataGeneration;

    const imagesData = imageNodes.map((image) => {
      const nodeData = image.attrs.data as NodeEntity.NodeDataFile;
      return {
        key: nodeData.key,
        filename: nodeData.key,
      };
    });

    await this.updateNodeStatus(
      nodeGenerator,
      NodeEntity.GenerationStatusEnum.PROCESSING,
      (nodeDataGenerator.attempts || 0) + 1,
    );

    const { key, totalTokens } = await this.imageGatewayAI.processImage({
      images: imagesData,
      prompt: nodeDataPrompt.prompt,
      parameters: nodeDataGenerator.parameters,
    });

    await this.updateNodeStatus(nodeGenerator, NodeEntity.GenerationStatusEnum.COMPLETED);

    const resultNode = await this.createOrUpdateResultNode(
      flowId,
      nodeGenerator,
      nodeDataGenerator,
      key,
      totalTokens,
    );

    await this.saveResultsAndCreateEdge(flowId, nodeGenerator, resultNode);
  }

  private async updateNodeStatus(
    nodeGenerator: NodeEntity,
    status: NodeEntity.GenerationStatusEnum,
    attempts?: number,
  ): Promise<void> {
    const currentData = nodeGenerator.attrs.data as NodeEntity.NodeDataGeneration;

    nodeGenerator.updateAttributes({
      data: {
        ...currentData,
        status,
        ...(attempts !== undefined && {
          attempts,
        }),
      } as NodeEntity.NodeDataGeneration,
    });

    await this.nodeRepository.update(nodeGenerator);
  }

  private async createOrUpdateResultNode(
    flowId: string,
    nodeGenerator: NodeEntity,
    nodeDataGenerator: NodeEntity.NodeDataGeneration,
    imageKey: string,
    totalTokens: number,
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
            totalTokens,
          } as NodeEntity.NodeDataFile,
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
        totalTokens: nodeDataGenerator.totalTokens,
      },
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
      throw error;
    }

    const currentData = nodeGenerator.attrs.data;
    const shouldFail = currentData.attempts && currentData.attempts >= MAX_ATTEMPTS;
    const newStatus = shouldFail
      ? NodeEntity.GenerationStatusEnum.FAILED
      : NodeEntity.GenerationStatusEnum.QUEUED;

    await this.updateNodeStatus(nodeGenerator, newStatus);

    throw error;
  }
}
