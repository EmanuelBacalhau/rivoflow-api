import { INodeCreationStrategy } from '@application/contracts/interfaces/node-creation-strategy';
import { NodeEntity } from '@application/entities/node.entity';

export class ImageNodeStrategy implements INodeCreationStrategy {
  prepareData(): NodeEntity.NodeDataFile {
    return {
      type: NodeEntity.NodeType.IMAGE,
      key: '',
    };
  }
}
