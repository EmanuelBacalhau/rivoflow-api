import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { FlowDrizzleRepository } from '@infra/database/drizzle/repositories/flow-drizzle.repository';
import { Injectable } from 'src/kernel/decorators/injectable';

interface UpdateFlowUseCaseInput {
  flowId: string;
  title?: string;
  accountId: string;
}

@Injectable()
export class UpdateFlowUseCase implements IUseCase<UpdateFlowUseCaseInput, void> {
  constructor(private readonly flowRepository: FlowDrizzleRepository) {}

  async execute(params: UpdateFlowUseCaseInput): Promise<void> {
    const flow = await this.flowRepository.findById(params.flowId);

    if (!flow) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND,'Flow not found');
    }

    if (flow.attrs.accountId !== params.accountId) {
      throw new ApplicationError(ErrorCode.FORBIDDEN);
    }

    if (params.title) {
      flow.updateAttributes({
        title: params.title,
        updatedAt: new Date(),
      });
    }

    await this.flowRepository.update(flow);
  }
}
