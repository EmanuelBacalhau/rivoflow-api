import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { EdgeEntity } from '@application/entities/edge.entity';
import { EdgeDynamoRepository } from '@infra/database/dynamo/repositories/edge-dynamo.repository';
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
  constructor(private readonly edgeRepository: EdgeDynamoRepository) {}

  async execute(params: CreateEdgeUseCaseInput): Promise<CreateEdgeUseCaseOutput> {
    // TODO: Implement validation for flowId, sourceNodeId, and targetNodeId

    const edge = new EdgeEntity({
      sourceNodeId: params.sourceNodeId,
      targetNodeId: params.targetNodeId,
      flowId: params.flowId,
    });

    await this.edgeRepository.save(edge);

    return {
      edge: edge.attrs,
    };
  }
}
