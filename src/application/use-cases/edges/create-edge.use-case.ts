import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { EdgeEntity } from '@application/entities/edge.entity';
import { EdgeDrizzleRepository } from '@infra/database/drizzle/repositories/edge-drizzle.repository';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
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
    private readonly edgeRepository: EdgeDrizzleRepository,
    private readonly nodeRepository: NodeDrizzleRepository,
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

    if (!nodeGenerator?.isGeneration()) {
      return {
        edge: edge.attrs,
      };
    }

    const genData = nodeGenerator.attrs.data;
    const updatedInputs = [...new Set([...(genData.inputs || []), sourceNodeId])];

    nodeGenerator.updateAttributes({
      data: { ...genData, inputs: updatedInputs },
    });

    await this.nodeRepository.update(nodeGenerator);

    return {
      edge: edge.attrs,
    };
  }
}
