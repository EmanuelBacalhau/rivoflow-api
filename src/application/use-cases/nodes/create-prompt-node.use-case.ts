import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { FlowDrizzleRepository } from '@infra/database/drizzle/repositories/flow-drizzle.repository';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { Injectable } from 'src/kernel/decorators/injectable';

type CreatePromptNodeUseCaseInput = {
  flowId: string;
  position: NodeEntity.Position;
};

type CreatePromptNodeUseCaseOutput = {
  node: NodeEntity.AllAttributes;
};

@Injectable()
export class CreatePromptNodeUseCase
  implements IUseCase<CreatePromptNodeUseCaseInput, CreatePromptNodeUseCaseOutput>
{
  constructor(
    private readonly nodeRepository: NodeDrizzleRepository,
    private readonly flowRepository: FlowDrizzleRepository,
  ) {}

  async execute(params: CreatePromptNodeUseCaseInput): Promise<CreatePromptNodeUseCaseOutput> {
    const flow = await this.flowRepository.findById(params.flowId);

    if (!flow) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Flow not found');
    }

    const node = new NodeEntity({
      flowId: params.flowId,
      nodeType: NodeEntity.NodeType.PROMPT,
      position: params.position,
      isExecuted: false,
      data: {
        prompt: '',
      },
    });

    await this.nodeRepository.save(node);

    return {
      node: node.attrs,
    };
  }
}
