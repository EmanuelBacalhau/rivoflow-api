import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { FlowEntity } from '@application/entities/flow.entity';
import { FlowDrizzleRepository } from '@infra/database/drizzle/repositories/flow-drizzle.repository';
import { Injectable } from 'src/kernel/decorators/injectable';

interface ListFlowsByAccountUseCaseInput {
  accountId: string;
}

interface ListFlowsByAccountUseCaseOutput {
  flows: Omit<FlowEntity.AllAttributes, 'nodes' | 'edges'>[];
}

@Injectable()
export class ListFlowsByAccountUseCase
  implements IUseCase<ListFlowsByAccountUseCaseInput, ListFlowsByAccountUseCaseOutput>
{
  constructor(private readonly flowRepository: FlowDrizzleRepository) {}

  async execute(params: ListFlowsByAccountUseCaseInput): Promise<ListFlowsByAccountUseCaseOutput> {
    const flows = await this.flowRepository.findByAccountId(params.accountId);

    return {
      flows: flows.map((flow) => ({
        id: flow.attrs.id,
        title: flow.attrs.title,
        accountId: flow.attrs.accountId,
        createdAt: flow.attrs.createdAt,
        updatedAt: flow.attrs.updatedAt,
      })),
    };
  }
}
