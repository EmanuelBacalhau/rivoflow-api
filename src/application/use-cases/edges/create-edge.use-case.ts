import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { EdgeEntity } from '@application/entities/edge.entity';
import { EdgeDrizzleRepository } from '@infra/database/drizzle/repositories/edge-drizzle.repository';
import { Injectable } from 'src/kernel/decorators/injectable';

type CreateEdgeUseCaseInput = {
  flowId: string;
  sourceNodeId: string;
  targetNodeId: string;
};

type CreateEdgeUseCaseOutput = {
  edge: EdgeEntity.AllAttributes;
};

@Injectable()
export class CreateEdgeUseCase
  implements IUseCase<CreateEdgeUseCaseInput, CreateEdgeUseCaseOutput>
{
  constructor(private readonly edgeRepository: EdgeDrizzleRepository) {}

  async execute(params: CreateEdgeUseCaseInput): Promise<CreateEdgeUseCaseOutput> {
    const { flowId, sourceNodeId, targetNodeId } = params;

    const edge = new EdgeEntity({
      sourceNodeId,
      targetNodeId,
      flowId,
    });

    await this.edgeRepository.save(edge);

    return {
      edge: edge.attrs,
    };
  }
}
