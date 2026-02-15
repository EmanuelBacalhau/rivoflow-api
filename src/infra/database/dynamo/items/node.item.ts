import { NodeEntity } from '@application/entities/node.entity';

export class NodeItem {
  static readonly type: NodeItem.Item['type'] = 'NODE';
  private readonly keys: NodeItem.Keys;

  constructor(private readonly attributes: NodeItem.Attributes) {
    this.keys = {
      PK: NodeItem.getPK(attributes.flowId),
      SK: NodeItem.getSK(attributes.id),
    };
  }

  toItem(): NodeItem.Item {
    return {
      ...this.keys,
      ...this.attributes,
      type: NodeItem.type,
    };
  }

  static fromEntity(entity: NodeEntity): NodeItem {
    const attributes: NodeItem.Attributes = {
      id: entity.attrs.id,
      flowId: entity.attrs.flowId,
      data: entity.attrs.data,
      position: entity.attrs.position,
      createdAt: entity.attrs.createdAt.toISOString(),
      updatedAt: entity.attrs.updatedAt.toISOString(),
      isExecuted: entity.attrs.isExecuted,
    };
    return new NodeItem(attributes);
  }

  static toEntity(item: NodeItem.Item): NodeEntity {
    return new NodeEntity({
      id: item.id,
      flowId: item.flowId,
      data: item.data,
      position: item.position,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      isExecuted: item.isExecuted,
    });
  }

  static getPK(id: string): NodeItem.Keys['PK'] {
    return `FLOW#${id}`;
  }

  static getSK(id: string): NodeItem.Keys['SK'] {
    return `NODE#${id}`;
  }
}

export namespace NodeItem {
  export type Attributes = {
    id: string;
    flowId: string;
    data: NodeEntity.NodeData;
    position: NodeEntity.Position;
    createdAt: string;
    updatedAt: string;
    isExecuted: boolean;
  };

  export type Keys = {
    PK: `FLOW#${string}`;
    SK: `NODE#${string}`;
  };

  export type Item = Keys &
    Attributes & {
      type: 'NODE';
    };
}
