import { INodeBehaviorStrategy } from '@application/contracts/interfaces/node-creation-strategy';
import { NodeEntity } from '@application/entities/node.entity';
import { GoogleTokensAIGateway } from '@infra/gateways/ai/google-tokens-ai.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

@Injectable()
export class PromptNodeStrategy implements INodeBehaviorStrategy<NodeEntity.PromptNodeData> {
  constructor(private readonly googleAIGateway: GoogleTokensAIGateway) {}

  prepareData(): NodeEntity.PromptNodeData {
    return {
      type: NodeEntity.NodeType.PROMPT,
      prompt: '',
      totalTokens: 0,
    };
  }

  async update(
    node: NodeEntity,
    data?: Partial<Omit<NodeEntity.PromptNodeData, 'type'>>,
    position?: NodeEntity.Position,
  ): Promise<void> {
    const currentPromptData = node.attrs.data as NodeEntity.PromptNodeData;
    const newPrompt = data?.prompt !== undefined ? data.prompt : currentPromptData.prompt;

    const totalTokens = newPrompt
      ? await this.googleAIGateway.countTokensForPrompt([
          {
            text: newPrompt,
          },
        ])
      : 0;

    node.updateAttributes({
      data: {
        ...currentPromptData,
        prompt: newPrompt,
        totalTokens,
      },
      ...(position && {
        position,
      }),
    });
  }
}
