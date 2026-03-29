import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { EdgeDrizzleRepository } from '@infra/database/drizzle/repositories/edge-drizzle.repository';
import { Injectable } from 'src/kernel/decorators/injectable';

type DeleteEdgeUseCaseInput = {
  flowId: string;
  edgeId: string;
};

@Injectable()
export class DeleteEdgeUseCase implements IUseCase<DeleteEdgeUseCaseInput, void> {
  constructor(private readonly edgeRepository: EdgeDrizzleRepository) {}

  async execute(params: DeleteEdgeUseCaseInput): Promise<void> {
    const edge = await this.edgeRepository.findById({
      flowId: params.flowId,
      edgeId: params.edgeId,
    });

    if (!edge) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Edge not found');
    }

    await this.edgeRepository.delete(params);
  }
}
