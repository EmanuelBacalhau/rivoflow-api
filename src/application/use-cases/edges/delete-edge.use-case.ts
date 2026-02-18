import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { EdgeDynamoRepository } from '@infra/database/dynamo/repositories/edge-dynamo.repository';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { Injectable } from 'src/kernel/decorators/injectable';

type DeleteEdgeUseCaseInput = {
  flowId: string;
  edgeId: string;
};

type DeleteEdgeUseCaseOutput = void;

@Injectable()
export class DeleteEdgeUseCase
  implements IUseCase<DeleteEdgeUseCaseInput, DeleteEdgeUseCaseOutput>
{
  constructor(
    private readonly edgeRepository: EdgeDynamoRepository,
    private readonly nodeRepository: NodeDynamoRepository,
  ) {}

  async execute(params: DeleteEdgeUseCaseInput): Promise<DeleteEdgeUseCaseOutput> {
    const edge = await this.edgeRepository.findById({
      flowId: params.flowId,
      edgeId: params.edgeId,
    });

    if (!edge) {
      throw new ResourceNotFoundError('Edge not found');
    }

    const node = await this.nodeRepository.findById(edge.attrs.targetNodeId, params.flowId);

    await this.edgeRepository.delete(params);

    if (node?.attrs.data.type === NodeEntity.NodeType.GENERATION_IMAGE) {
      const nodeGeneratorData = node.attrs.data as NodeEntity.NodeDataGeneration;

      const updatedInputs = nodeGeneratorData.inputs.filter(
        (input) => input !== edge.attrs.sourceNodeId,
      );

      node.updateAttributes({
        data: {
          ...nodeGeneratorData,
          inputs: updatedInputs,
        },
      });

      await this.nodeRepository.update(node);
    }
  }
}
