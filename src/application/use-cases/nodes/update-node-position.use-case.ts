import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { FlowDrizzleRepository } from '@infra/database/drizzle/repositories/flow-drizzle.repository';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { DrizzleTransaction } from '@infra/database/drizzle/drizzle-transaction';
import { Injectable } from 'src/kernel/decorators/injectable';

type UpdateNodePositionUseCaseInput = {
  nodeId: string;
  flowId: string;
  position: NodeEntity.Position;
};

@Injectable()
export class UpdateNodePositionUseCase implements IUseCase<UpdateNodePositionUseCaseInput, void> {
  constructor(
    private readonly nodeRepository: NodeDrizzleRepository,
    private readonly flowRepository: FlowDrizzleRepository,
    private readonly transactWrite: DrizzleTransaction,
  ) {}

  async execute(params: UpdateNodePositionUseCaseInput): Promise<void> {
    const { nodeId, flowId, position } = params;

    const flow = await this.flowRepository.findById(flowId);

    if (!flow) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Flow not found');
    }

    const node = await this.nodeRepository.findById(nodeId, flowId);

    if (!node) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Node not found');
    }

    node.updateAttributes({
      position,
    });

    flow.updateAttributes({
      updatedAt: new Date(),
    });

    await this.transactWrite.execute(async (tx) => {
      await this.flowRepository.update(flow, tx);
      await this.nodeRepository.update(node, tx);
    });
  }
}
