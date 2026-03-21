import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { FlowDynamoRepository } from '@infra/database/dynamo/repositories/flow-dynamo.repository';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
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
    private readonly nodeRepository: NodeDynamoRepository,
    private readonly flowRepository: FlowDynamoRepository,
  ) {}

  async execute(params: CreatePromptNodeUseCaseInput): Promise<CreatePromptNodeUseCaseOutput> {
    const flow = await this.flowRepository.findById(params.flowId);

    if (!flow) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND,'Flow not found');
    }

    const node = new NodeEntity({
      flowId: params.flowId,
      position: params.position,
      isExecuted: false,
      totalTokens: 0,
      data: {
        type: NodeEntity.NodeType.PROMPT,
        prompt: '',
      },
    });

    await this.nodeRepository.save(node);

    return { node: node.attrs };
  }
}
