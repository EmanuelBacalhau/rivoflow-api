import { INodeBehaviorStrategy } from '@application/contracts/interfaces/node-creation-strategy';
import { NodeEntity } from '@application/entities/node.entity';
import { Injectable } from 'src/kernel/decorators/injectable';

@Injectable()
export class ImageNodeStrategy implements INodeBehaviorStrategy<NodeEntity.FileNodeData> {
  prepareData(): NodeEntity.FileNodeData {
    return {
      type: NodeEntity.NodeType.IMAGE,
      totalTokens: 0,
    };
  }

  async update(
    node: NodeEntity,
    data?: Partial<Omit<NodeEntity.FileNodeData, 'type'>>,
    position?: NodeEntity.Position,
  ): Promise<void> {
    if (position) {
      node.updateAttributes({
        position,
      });
    }
  }
}
