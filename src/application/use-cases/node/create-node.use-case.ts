import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import {
  CreateNodeUseCaseInput,
  CreateNodeUseCaseOutput,
} from '@application/contracts/interfaces/node-creation-strategy';
import { NodeEntity } from '@application/entities/node.entity';
import { NodeStrategyFactory } from '@application/factories/node-strategy.factory';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { Injectable } from 'src/kernel/decorators/injectable';

@Injectable()
export class CreateNodeUseCase
  implements IUseCase<CreateNodeUseCaseInput, CreateNodeUseCaseOutput>
{
  constructor(
    private readonly nodeRepository: NodeDynamoRepository,
    private readonly nodeStrategyFactory: NodeStrategyFactory,
  ) {}

  async execute(params: CreateNodeUseCaseInput): Promise<CreateNodeUseCaseOutput> {
    // TODO: Implement validation for flowId

    const strategy = this.nodeStrategyFactory.getStrategy(params.type);

    const nodeData = strategy.prepareData();

    const node = new NodeEntity({
      flowId: params.flowId,
      position: params.position,
      data: nodeData,
      isExecuted: false,
    });

    await this.nodeRepository.save(node);

    return {
      node: {
        ...node.attrs,
        data: {
          ...node.attrs.data,
          fileUrl: node.attrs.data.type === NodeEntity.NodeType.IMAGE ? 'NO FILE URL' : undefined,
        },
      },
    };
  }
}
