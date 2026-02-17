import { INodeCreationStrategy } from '@application/contracts/interfaces/node-creation-strategy';
import { NodeEntity } from '@application/entities/node.entity';

export class PromptNodeStrategy implements INodeCreationStrategy {
  prepareData(): NodeEntity.NodeDataPrompt {
    return {
      type: NodeEntity.NodeType.PROMPT,
      prompt: '',
      totalTokens: 0,
    };
  }
}
