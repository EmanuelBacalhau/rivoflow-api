import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { ImageSQSGateway } from '@infra/gateways/aws/image-sqs.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

interface CreateImageAIUseCaseInput {
  flowId: string;
  nodeGeneratorId: string;
}

@Injectable()
export class CreateImageAIUseCase implements IUseCase<CreateImageAIUseCaseInput, void> {
  constructor(
    private readonly imageSQSGateway: ImageSQSGateway,
    private readonly nodeRepository: NodeDynamoRepository,
  ) {}

  async execute(params: CreateImageAIUseCaseInput): Promise<void> {
    const { flowId, nodeGeneratorId } = params;

    const generatorNode = await this.nodeRepository.findById(nodeGeneratorId, flowId);

    if (!generatorNode) {
      throw new ResourceNotFoundError('Node not found');
    }

    if (generatorNode.attrs.data.type !== NodeEntity.NodeType.GENERATION_IMAGE) {
      throw new ResourceNotFoundError('Node is not a generation node');
    }

    const genData = generatorNode.attrs.data as NodeEntity.NodeDataGeneration;
    const inputs = genData.inputs;

    const inputNodes = inputs.length
      ? await this.nodeRepository.findNodesByIds({ flowId, nodeIds: inputs })
      : [];

    const totalTokens = inputNodes.reduce((acc, n) => acc + n.attrs.data.totalTokens, 0);

    generatorNode.updateAttributes({
      data: {
        ...genData,
        status: NodeEntity.GenerationStatusEnum.QUEUED,
        totalTokens,
      },
      isExecuted: true,
    });

    const updatePromises = [
      this.nodeRepository.update(generatorNode),
      ...inputNodes.map((n) => {
        n.updateAttributes({ isExecuted: true });
        return this.nodeRepository.update(n);
      }),
    ];

    await Promise.all([
      ...updatePromises,
      this.imageSQSGateway.publish({ flowId, nodeGeneratorId, inputs }),
    ]);
  }
}
