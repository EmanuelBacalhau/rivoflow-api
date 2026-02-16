import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { ImageGatewayAI } from '@infra/gateways/ai/image-ai.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

const MAX_ATTEMPTS = 3;

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
  ) {}

  async execute(params: ProcessImageAIUseCaseInput): Promise<void> {
    const { flowId, nodeGeneratorId, inputs } = params;

    const nodes = await this.nodeRepository.findNodesByIds({
      flowId,
      nodeIds: inputs.concat(nodeGeneratorId),
    });

    const nodeGenerator = nodes.find((node) => node.attrs.id === nodeGeneratorId)!;

    if (
      nodeGenerator.attrs.data.type === NodeEntity.NodeType.GENERATION_IMAGE &&
      nodeGenerator.attrs.data.status === NodeEntity.GenerationStatusEnum.PROCESSING
    ) {
      throw new Error('Node is already being processed');
    }

    if (
      nodeGenerator.attrs.data.type === NodeEntity.NodeType.GENERATION_IMAGE &&
      nodeGenerator.attrs.data.status === NodeEntity.GenerationStatusEnum.COMPLETED
    ) {
      throw new Error('Node has already been processed');
    }

    const prompt = nodes.find((node) => node.attrs.data.type === NodeEntity.NodeType.PROMPT)!;
    const images = nodes.filter((node) => node.attrs.data.type === NodeEntity.NodeType.IMAGE);

    try {
      const nodaDataPrompts = prompt.attrs.data as NodeEntity.NodeDataPrompt;
      const nodeDataGenerator = nodeGenerator.attrs.data as NodeEntity.NodeDataGeneration;
      const imagesData = images.map((image) => {
        const nodeData = image.attrs.data as NodeEntity.NodeDataFile;
        return {
          key: nodeData.key,
          filename: nodeData.key,
        };
      });

      nodeGenerator.updateAttributes({
        data: {
          ...nodeGenerator.attrs.data,
          status: NodeEntity.GenerationStatusEnum.PROCESSING,
          attempts: (nodeDataGenerator.attempts || 0) + 1,
        } as NodeEntity.NodeDataGeneration,
      });

      await this.nodeRepository.update(nodeGenerator);

      const key = await this.imageGatewayAI.processImage({
        images: imagesData,
        prompt: nodaDataPrompts.prompt,
        parameters: nodeDataGenerator.parameters,
      });

      nodeGenerator.updateAttributes({
        data: {
          ...nodeGenerator.attrs.data,
          status: NodeEntity.GenerationStatusEnum.COMPLETED,
        } as NodeEntity.NodeDataGeneration,
      });

      if (nodeDataGenerator.outputNodeId) {
        const nodeResult = await this.nodeRepository.findById(
          nodeDataGenerator.outputNodeId,
          flowId,
        );

        if (nodeResult) {
          nodeResult.updateAttributes({
            data: {
              type: NodeEntity.NodeType.RESULT,
              key,
            } as NodeEntity.NodeDataFile,
            isExecuted: true,
          });

          await this.nodeRepository.update(nodeResult);
        }
      }

      await this.nodeRepository.update(nodeGenerator);
    } catch (error) {
      if (nodeGenerator.attrs.data.type === NodeEntity.NodeType.GENERATION_IMAGE) {
        nodeGenerator.updateAttributes({
          data: {
            ...nodeGenerator.attrs.data,
            status:
              nodeGenerator.attrs.data.attempts && nodeGenerator.attrs.data.attempts >= MAX_ATTEMPTS
                ? NodeEntity.GenerationStatusEnum.FAILED
                : NodeEntity.GenerationStatusEnum.QUEUED,
          } as NodeEntity.NodeDataGeneration,
        });

        await this.nodeRepository.update(nodeGenerator);

        throw error;
      }
    }
  }
}
