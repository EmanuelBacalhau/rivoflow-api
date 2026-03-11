import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import {
  CreateNodeUseCaseInput,
  CreateNodeUseCaseOutput,
} from '@application/contracts/interfaces/node-creation-strategy';
import { NodeEntity } from '@application/entities/node.entity';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { NodeStrategyFactory } from '@application/factories/node-strategy.factory';
import { FlowDynamoRepository } from '@infra/database/dynamo/repositories/flow-dynamo.repository';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { Injectable } from 'src/kernel/decorators/injectable';

@Injectable()
export class CreateNodeUseCase
  implements IUseCase<CreateNodeUseCaseInput, CreateNodeUseCaseOutput>
{
  constructor(
    private readonly nodeRepository: NodeDynamoRepository,
    private readonly nodeStrategyFactory: NodeStrategyFactory,
    private readonly flowRepository: FlowDynamoRepository,
  ) {}

  async execute(params: CreateNodeUseCaseInput): Promise<CreateNodeUseCaseOutput> {
    const flow = await this.flowRepository.findById(params.flowId);

    if (!flow) {
      throw new ResourceNotFoundError('Flow not found');
    }

    const strategy = this.nodeStrategyFactory.getStrategy(params.type);

    const nodeData = strategy.prepareData();

    const node = new NodeEntity({
      flowId: params.flowId,
      position: params.position,
      data: nodeData,
      isExecuted: false,
    });

    await this.nodeRepository.save(node);

    const data = {
      ...node.attrs.data,
    } as Record<string, unknown>;

    delete data.totalTokens;
    delete data.model;

    return {
      node: {
        ...node.attrs,
        data: data as Omit<NodeEntity.NodeData, 'totalTokens' | 'model'>,
      },
    };
  }
}
