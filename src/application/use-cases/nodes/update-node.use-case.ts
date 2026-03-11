import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { NodeStrategyFactory } from '@application/factories/node-strategy.factory';
import { FlowDynamoRepository } from '@infra/database/dynamo/repositories/flow-dynamo.repository';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { UpdateNodeUnitOfWork } from '@infra/database/dynamo/uows/update-node.uow';
import { Injectable } from 'src/kernel/decorators/injectable';

export type UpdateNodeData = Partial<
  Omit<NodeEntity.PromptNodeData, 'type'> &
    Omit<NodeEntity.FileNodeData, 'type'> &
    Omit<NodeEntity.GenerationImageNodeData, 'type'>
>;

export type UpdateNodeUseCaseInput = {
  nodeId: string;
  flowId: string;
  data?: UpdateNodeData;
  position?: NodeEntity.Position;
};

@Injectable()
export class UpdateNodeUseCase implements IUseCase<UpdateNodeUseCaseInput, void> {
  constructor(
    private readonly nodeRepository: NodeDynamoRepository,
    private readonly flowRepository: FlowDynamoRepository,
    private readonly updateNodeUOW: UpdateNodeUnitOfWork,
    private readonly nodeStrategyFactory: NodeStrategyFactory,
  ) {}

  async execute(params: UpdateNodeUseCaseInput): Promise<void> {
    const { nodeId, flowId, data, position } = params;

    const flow = await this.flowRepository.findById(flowId);

    if (!flow) {
      throw new ResourceNotFoundError('Flow not found');
    }

    const node = await this.nodeRepository.findById(nodeId, flowId);

    if (!node) {
      throw new ResourceNotFoundError('Node not found');
    }

    const strategy = this.nodeStrategyFactory.getStrategy(node.attrs.data.type);
    await strategy.update(node, data, position);

    flow.updateAttributes({
      updatedAt: new Date(),
    });

    await this.updateNodeUOW.run({
      flow,
      node,
    });
  }
}
