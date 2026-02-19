import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { FlowEntity } from '@application/entities/flow.entity';
import { FlowDynamoRepository } from '@infra/database/dynamo/repositories/flow-dynamo.repository';
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
  constructor(private readonly flowRepository: FlowDynamoRepository) {}

  async execute(params: CreateFlowUseCaseInput): Promise<CreateFlowUseCaseOutput> {
    const flow = new FlowEntity({
      title: params.title,
      accountId: params.accountId,
    });

    await this.flowRepository.save(flow);

    return {
      flow: flow.attrs,
    };
  }
}
