import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { FlowEntity } from '@application/entities/flow.entity';
import { FlowDynamoRepository } from '@infra/database/dynamo/repositories/flow-dynamo.repository';

interface CreateFlowUseCaseInput {
  title: string;
  projectId: string;
}

interface CreateFlowUseCaseOutput {
  flow: FlowEntity.AllAttributes;
}

export class CreateFlowUseCase
  implements IUseCase<CreateFlowUseCaseInput, CreateFlowUseCaseOutput>
{
  constructor(private readonly flowRepository: FlowDynamoRepository) {}

  async execute(params: CreateFlowUseCaseInput): Promise<CreateFlowUseCaseOutput> {
    const flow = new FlowEntity({
      title: params.title,
      projectId: params.projectId,
    });

    await this.flowRepository.save(flow);

    return {
      flow: flow.attrs,
    };
  }
}
