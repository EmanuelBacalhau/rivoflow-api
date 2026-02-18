import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { EdgeEntity } from '@application/entities/edge.entity';
import { NodeEntity } from '@application/entities/node.entity';
import { EdgeDynamoRepository } from '@infra/database/dynamo/repositories/edge-dynamo.repository';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { Injectable } from 'src/kernel/decorators/injectable';

type CreateEdgeUseCaseInput = {
  flowId: string;
  sourceNodeId: string;
  targetNodeId: string;
};

type CreateEdgeUseCaseOutput = {
  edge: EdgeEntity.AllAttributes;
  creditsRequired?: number;
};

@Injectable()
export class CreateEdgeUseCase
  implements IUseCase<CreateEdgeUseCaseInput, CreateEdgeUseCaseOutput>
{
  constructor(
    private readonly edgeRepository: EdgeDynamoRepository,
    private readonly nodeRepository: NodeDynamoRepository,
  ) {}

  async execute(params: CreateEdgeUseCaseInput): Promise<CreateEdgeUseCaseOutput> {
    const { flowId, sourceNodeId, targetNodeId } = params;

    const edge = new EdgeEntity({
      sourceNodeId,
      targetNodeId,
      flowId,
    });

    await this.edgeRepository.save(edge);

    const nodeGenerator = await this.nodeRepository.findById(targetNodeId, flowId);

    if (nodeGenerator?.attrs.data.type !== NodeEntity.NodeType.GENERATION_IMAGE) {
      return {
        edge: edge.attrs,
      };
    }

    const nodeGeneratorData = nodeGenerator.attrs.data as NodeEntity.NodeDataGeneration;

    const updatedInputs = [
      ...new Set([
        ...nodeGeneratorData.inputs,
        sourceNodeId,
      ]),
    ];

    nodeGenerator.updateAttributes({
      data: {
        ...nodeGeneratorData,
        inputs: updatedInputs,
      },
    });

    await this.nodeRepository.update(nodeGenerator);

    return {
      edge: edge.attrs,
    };
  }
}
