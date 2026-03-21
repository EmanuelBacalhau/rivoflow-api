import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { FlowEntity } from '@application/entities/flow.entity';
import { FlowDrizzleRepository } from '@infra/database/drizzle/repositories/flow-drizzle.repository';
import { Injectable } from 'src/kernel/decorators/injectable';

interface CreateFlowUseCaseInput {
  title: string;
  accountId: string;
}

interface CreateFlowUseCaseOutput {
  flow: FlowEntity.AllAttributes;
}

@Injectable()
export class CreateFlowUseCase
  implements IUseCase<CreateFlowUseCaseInput, CreateFlowUseCaseOutput>
{
  constructor(private readonly flowRepository: FlowDrizzleRepository) {}

  async execute(params: CreateFlowUseCaseInput): Promise<CreateFlowUseCaseOutput> {
    const flow = new FlowEntity({
      title: params.title,
      accountId: params.accountId,
    });

    await this.flowRepository.create(flow);

    return {
      flow: flow.attrs,
    };
  }
}
