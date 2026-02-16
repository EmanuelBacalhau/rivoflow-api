import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { EdgeEntity } from '@application/entities/edge.entity';
import { NodeEntity } from '@application/entities/node.entity';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { EdgeDynamoRepository } from '@infra/database/dynamo/repositories/edge-dynamo.repository';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { ImageSQSGateway } from '@infra/gateways/aws/ImageSQSGateway';
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
    private readonly edgeRepository: EdgeDynamoRepository,
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

    const nodeResult = new NodeEntity({
      flowId,
      position: {
        x: node.attrs.position.x + 150,
        y: node.attrs.position.y,
      },
      data: {
        type: NodeEntity.NodeType.RESULT,
        key: '',
      },
      isExecuted: false,
    });

    await this.nodeRepository.save(nodeResult);

    const nodesToUpdate = nodes.map((n) => {
      if (n.attrs.data.type === NodeEntity.NodeType.GENERATION_IMAGE) {
        n.updateAttributes({
          data: {
            ...n.attrs.data,
            inputs,
            outputNodeId: nodeResult.attrs.id,
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

    const edge = new EdgeEntity({
      flowId,
      sourceNodeId: nodeGeneratorId,
      targetNodeId: nodeResult.attrs.id,
    });

    await Promise.all([
      ...updatePromises,
      this.edgeRepository.save(edge),
      this.imageSQSGateway.publish({
        flowId,
        nodeGeneratorId,
        inputs,
      }),
    ]);
  }
}
