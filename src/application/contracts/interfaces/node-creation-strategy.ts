import { NodeEntity } from '@application/entities/node.entity';

export interface CreateNodeUseCaseInput {
  flowId: string;
  type: NodeEntity.NodeType;
  position: NodeEntity.Position;
}

export interface CreateNodeUseCaseOutput {
  node: Omit<NodeEntity.AllAttributes, 'data'> & {
    data: Omit<NodeEntity.NodeData, 'totalTokens' | 'model'>;
  };
}

export interface INodeCreationStrategy {
  prepareData(): NodeEntity.NodeData;
}
