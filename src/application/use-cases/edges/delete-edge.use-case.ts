import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { EdgeDynamoRepository } from '@infra/database/dynamo/repositories/edge-dynamo.repository';
import { Injectable } from 'src/kernel/decorators/injectable';

type DeleteEdgeUseCaseInput = Array<{
  flowId: string;
  edgeId: string;
}>;

type DeleteEdgeUseCaseOutput = void;

@Injectable()
export class DeleteEdgeUseCase
  implements IUseCase<DeleteEdgeUseCaseInput, DeleteEdgeUseCaseOutput>
{
  constructor(private readonly edgeRepository: EdgeDynamoRepository) {}

  async execute(params: DeleteEdgeUseCaseInput): Promise<DeleteEdgeUseCaseOutput> {
    await this.edgeRepository.deleteMany(params);
  }
}
