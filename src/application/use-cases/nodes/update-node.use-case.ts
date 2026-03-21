import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { FlowDynamoRepository } from '@infra/database/dynamo/repositories/flow-dynamo.repository';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { TransactWrite } from '@infra/database/dynamo/transact-write';
import { GoogleTokensAIGateway } from '@infra/gateways/ai/google-tokens-ai.gateway';
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
    private readonly googleAIGateway: GoogleTokensAIGateway,
  ) {}

  async execute(params: UpdateNodeUseCaseInput): Promise<void> {
    const { nodeId, flowId, data, position } = params;

    const flow = await this.flowRepository.findById(flowId);

    if (!flow) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Flow not found');
    }

    const node = await this.nodeRepository.findById(nodeId, flowId);

    if (!node) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Node not found');
    }

    await this.applyUpdate(node, data, position);

    flow.updateAttributes({
      updatedAt: new Date(),
    });

    await new TransactWrite()
      .addUpdate(this.flowRepository.getUpdateCommandInput(flow))
      .addUpdate(this.nodeRepository.getUpdateCommandInput(node))
      .commit();
  }

  private async applyUpdate(
    node: NodeEntity,
    data?: UpdateNodeData,
    position?: NodeEntity.Position,
  ): Promise<void> {
    const nodeType = node.attrs.data.type;

    if (nodeType === NodeEntity.NodeType.PROMPT) {
      const currentData = node.attrs.data as NodeEntity.PromptNodeData;
      const newPrompt = data?.prompt !== undefined ? data.prompt : currentData.prompt;

      const totalTokens = newPrompt
        ? await this.googleAIGateway.countTokensForPrompt([{ text: newPrompt }])
        : 0;

      node.updateAttributes({
        totalTokens,
        data: { ...currentData, prompt: newPrompt },
        ...(position && { position }),
      });
      return;
    }

    if (nodeType === NodeEntity.NodeType.GENERATION_IMAGE) {
      const currentData = node.attrs.data as NodeEntity.GenerationImageNodeData;
      const newParameters = data?.parameters ?? currentData.parameters;

      node.updateAttributes({
        data: { ...currentData, parameters: newParameters },
        ...(position && { position }),
      });
      return;
    }

    // IMAGE / RESULT_IMAGE: only position update
    if (position) {
      node.updateAttributes({ position });
    }
  }
}
