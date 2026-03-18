import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { FlowDynamoRepository } from '@infra/database/dynamo/repositories/flow-dynamo.repository';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { GeminiPricing } from '@shared/config/gemini-pricing';
import { Injectable } from 'src/kernel/decorators/injectable';

type CreateFileNodeUseCaseInput = {
  flowId: string;
  position: NodeEntity.Position;
  inputType: NodeEntity.FileNodeData['inputType'];
};

type CreateFileNodeUseCaseOutput = {
  node: NodeEntity.AllAttributes;
};

@Injectable()
export class CreateFileNodeUseCase
  implements IUseCase<CreateFileNodeUseCaseInput, CreateFileNodeUseCaseOutput>
{
  constructor(
    private readonly nodeRepository: NodeDynamoRepository,
    private readonly flowRepository: FlowDynamoRepository,
  ) {}

  async execute(params: CreateFileNodeUseCaseInput): Promise<CreateFileNodeUseCaseOutput> {
    const flow = await this.flowRepository.findById(params.flowId);

    if (!flow) {
      throw new ResourceNotFoundError('Flow not found');
    }

    const node = new NodeEntity({
      flowId: params.flowId,
      position: params.position,
      isExecuted: false,
      totalTokens: params.inputType === 'IMAGE' ? GeminiPricing.inputImageTokens : 0,
      data: {
        type: NodeEntity.NodeType.IMAGE,
      },
    });

    await this.nodeRepository.save(node);

    return {
      node: node.attrs,
    };
  }
}
