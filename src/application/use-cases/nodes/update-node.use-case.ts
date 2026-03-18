import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { FlowDynamoRepository } from '@infra/database/dynamo/repositories/flow-dynamo.repository';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { UpdateNodeUnitOfWork } from '@infra/database/dynamo/uows/update-node.uow';
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
    private readonly updateNodeUOW: UpdateNodeUnitOfWork,
    private readonly googleAIGateway: GoogleTokensAIGateway,
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

    await this.applyUpdate(node, data, position);

    flow.updateAttributes({
      updatedAt: new Date(),
    });

    await this.updateNodeUOW.run({
      flow,
      node,
    });
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
