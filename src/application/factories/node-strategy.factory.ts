import { INodeBehaviorStrategy } from '@application/contracts/interfaces/node-creation-strategy';
import { NodeEntity } from '@application/entities/node.entity';
import { InvalidNodeTypeError } from '@application/errors/application/invalid-node-type.error';
import { GenerationImageNodeStrategy } from '@application/strategies/generation-image-node.strategy';
import { ImageNodeStrategy } from '@application/strategies/image-node.strategy';
import { PromptNodeStrategy } from '@application/strategies/prompt-node.strategy';
import { Injectable } from 'src/kernel/decorators/injectable';

@Injectable()
export class NodeStrategyFactory {
  constructor(
    private readonly promptNodeStrategy: PromptNodeStrategy,
    private readonly imageNodeStrategy: ImageNodeStrategy,
    private readonly generationImageNodeStrategy: GenerationImageNodeStrategy,
  ) {}

  getStrategy(type: NodeEntity.NodeType): INodeBehaviorStrategy {
    switch (type) {
      case NodeEntity.NodeType.PROMPT:
        return this.promptNodeStrategy;

      case NodeEntity.NodeType.IMAGE:
      case NodeEntity.NodeType.RESULT_IMAGE:
        return this.imageNodeStrategy;

      case NodeEntity.NodeType.GENERATION_IMAGE:
        return this.generationImageNodeStrategy;

      default:
        throw new InvalidNodeTypeError(`Strategy not found for node type: ${type}`);
    }
  }
}
