import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { ForbiddenError } from '@application/errors/application/forbidden.error';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { FlowDynamoRepository } from '@infra/database/dynamo/repositories/flow-dynamo.repository';
import { Injectable } from 'src/kernel/decorators/injectable';

interface UpdateFlowUseCaseInput {
  flowId: string;
  title?: string;
  accountId: string;
}

@Injectable()
export class UpdateFlowUseCase implements IUseCase<UpdateFlowUseCaseInput, void> {
  constructor(private readonly flowRepository: FlowDynamoRepository) {}

  async execute(params: UpdateFlowUseCaseInput): Promise<void> {
    const flow = await this.flowRepository.findById(params.flowId);

    if (!flow) {
      throw new ResourceNotFoundError('Flow not found');
    }

    if (flow.attrs.accountId !== params.accountId) {
      throw new ForbiddenError();
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
