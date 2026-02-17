import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { ImageSQSGateway } from '@infra/gateways/aws/image-sqs.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

interface CreateImageAIUseCaseInput {
  flowId: string;
  nodeGeneratorId: string;
  inputs: string[];
}

@Injectable()
export class CreateImageAIUseCase implements IUseCase<CreateImageAIUseCaseInput, void> {
  constructor(
    private readonly imageSQSGateway: ImageSQSGateway,
    private readonly nodeRepository: NodeDynamoRepository,
  ) {}

  async execute(params: CreateImageAIUseCaseInput): Promise<void> {
    const { flowId, nodeGeneratorId, inputs } = params;

    const nodes = await this.nodeRepository.findNodesByIds({
      flowId,
      nodeIds: inputs.concat([
        nodeGeneratorId,
      ]),
    });

    const node = nodes.find((n) => n.attrs.id === nodeGeneratorId);

    if (!node) {
      throw new ResourceNotFoundError('Node not found');
    }

    const nodesToUpdate = nodes.map((n) => {
      if (n.attrs.data.type === NodeEntity.NodeType.GENERATION_IMAGE) {
        n.updateAttributes({
          data: {
            ...n.attrs.data,
            inputs,
            status: NodeEntity.GenerationStatusEnum.QUEUED,
          },
          isExecuted: true,
        });
      }

      n.updateAttributes({
        isExecuted: true,
      });

      return n;
    });

    const updatePromises = nodesToUpdate.map((n) => this.nodeRepository.update(n));

    await Promise.all([
      ...updatePromises,
      this.imageSQSGateway.publish({
        flowId,
        nodeGeneratorId,
        inputs,
      }),
    ]);
  }
}
