import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { FlowDynamoRepository } from '@infra/database/dynamo/repositories/flow-dynamo.repository';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { UpdateNodeUnitOfWork } from '@infra/database/dynamo/uows/update-node.uow';
import { GoogleTokensAIGateway } from '@infra/gateways/ai/google-tokens-ai.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

type UpdateNodeData = {
  prompt?: string;
  parameters?: NodeEntity.NodeDataGenerationImage['parameters'];
};

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
    private readonly googleAIGateway: GoogleTokensAIGateway,
    private readonly flowRepository: FlowDynamoRepository,
    private readonly updateNodeUOW: UpdateNodeUnitOfWork,
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

    switch (node.attrs.data.type) {
      case NodeEntity.NodeType.PROMPT:
        await this.updatePromptNode(node, data, position);
        break;
      case NodeEntity.NodeType.GENERATION_IMAGE:
        this.updateGenerationNode(node, data, position);
        break;
      case NodeEntity.NodeType.IMAGE:
      case NodeEntity.NodeType.RESULT_IMAGE:
        this.updateFileNode(node, position);
        break;
    }

    flow.updateAttributes({
      updatedAt: new Date(),
    });

    await this.updateNodeUOW.run({
      flow,
      node,
    });
  }

  private async updatePromptNode(
    node: NodeEntity,
    data?: UpdateNodeData,
    position?: NodeEntity.Position,
  ): Promise<void> {
    const currentData = node.attrs.data as NodeEntity.NodeDataPrompt;

    const newPrompt = data?.prompt !== undefined ? data.prompt : currentData.prompt;

    const totalTokens = newPrompt
      ? await this.googleAIGateway.countTokensForPrompt([
          {
            text: newPrompt,
          },
        ])
      : 0;

    node.updateAttributes({
      data: {
        type: NodeEntity.NodeType.PROMPT,
        prompt: newPrompt,
        totalTokens,
      },
      position: position ?? node.attrs.position,
    });
  }

  private updateGenerationNode(
    node: NodeEntity,
    data?: UpdateNodeData,
    position?: NodeEntity.Position,
  ): void {
    const currentData = node.attrs.data as NodeEntity.NodeDataGenerationImage;

    const newParameters = data?.parameters ?? currentData.parameters;

    node.updateAttributes({
      data: {
        ...currentData,
        parameters: newParameters,
      },
      position: position ?? node.attrs.position,
    });
  }

  private updateFileNode(node: NodeEntity, position?: NodeEntity.Position): void {
    node.updateAttributes({
      position: position ?? node.attrs.position,
    });
  }
}
