import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { FlowDrizzleRepository } from '@infra/database/drizzle/repositories/flow-drizzle.repository';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { GeminiPricing } from '@shared/config/gemini-pricing';
import { Injectable } from 'src/kernel/decorators/injectable';

type CreateFileNodeUseCaseInput = {
  flowId: string;
  position: NodeEntity.Position;
  inputType: NodeEntity.FileData['inputType'];
};

type CreateFileNodeUseCaseOutput = {
  node: NodeEntity.AllAttributes;
};

@Injectable()
export class CreateFileNodeUseCase
  implements IUseCase<CreateFileNodeUseCaseInput, CreateFileNodeUseCaseOutput>
{
  constructor(
    private readonly nodeRepository: NodeDrizzleRepository,
    private readonly flowRepository: FlowDrizzleRepository,
  ) {}

  async execute(params: CreateFileNodeUseCaseInput): Promise<CreateFileNodeUseCaseOutput> {
    const flow = await this.flowRepository.findById(params.flowId);

    if (!flow) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND,'Flow not found');
    }

    const node = new NodeEntity({
      flowId: params.flowId,
      nodeType: NodeEntity.NodeType.IMAGE,
      position: params.position,
      isExecuted: false,
      totalTokens: params.inputType === 'IMAGE' ? GeminiPricing.inputImageTokens : 0,
      data: {},
    });

    await this.nodeRepository.save(node);

    return {
      node: node.attrs,
    };
  }
}
