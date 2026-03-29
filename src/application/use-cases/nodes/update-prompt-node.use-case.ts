import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { FlowDrizzleRepository } from '@infra/database/drizzle/repositories/flow-drizzle.repository';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { DrizzleTransaction } from '@infra/database/drizzle/drizzle-transaction';
import { Injectable } from 'src/kernel/decorators/injectable';

type UpdatePromptNodeUseCaseInput = {
  nodeId: string;
  flowId: string;
  prompt: string;
};

@Injectable()
export class UpdatePromptNodeUseCase implements IUseCase<UpdatePromptNodeUseCaseInput, void> {
  constructor(
    private readonly nodeRepository: NodeDrizzleRepository,
    private readonly flowRepository: FlowDrizzleRepository,
    private readonly transactWrite: DrizzleTransaction,
  ) {}

  async execute(params: UpdatePromptNodeUseCaseInput): Promise<void> {
    const { nodeId, flowId, prompt } = params;

    const flow = await this.flowRepository.findById(flowId);

    if (!flow) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Flow not found');
    }

    const node = await this.nodeRepository.findById(nodeId, flowId);

    if (!node) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Node not found');
    }

    if (!node.isPrompt()) {
      throw new ApplicationError(ErrorCode.INVALID_NODE_TYPE, 'Node is not a prompt type');
    }

    node.updateAttributes({
      data: {
        ...node.attrs.data,
        prompt,
      },
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
