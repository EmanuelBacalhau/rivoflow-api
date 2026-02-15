import { INodeCreationStrategy } from '@application/contracts/interfaces/node-creation-strategy';
import { NodeEntity } from '@application/entities/node.entity';
import { GenerationImageNodeStrategy } from '@application/strategies/generation-image-node.strategy';
import { ImageNodeStrategy } from '@application/strategies/image-node.strategy';
import { PromptNodeStrategy } from '@application/strategies/prompt-node.strategy';
import { Injectable } from 'src/kernel/decorators/injectable';

@Injectable()
export class NodeStrategyFactory {
  getStrategy(type: NodeEntity.NodeType): INodeCreationStrategy {
    switch (type) {
      case NodeEntity.NodeType.PROMPT:
        return new PromptNodeStrategy();

      case NodeEntity.NodeType.IMAGE:
        return new ImageNodeStrategy();

      case NodeEntity.NodeType.GENERATION_IMAGE:
        return new GenerationImageNodeStrategy();

      default:
        throw new Error(`Strategy not found for type: ${type}`);
    }
  }
}
