import { EdgeEntity } from '@application/entities/edge.entity';

export class EdgeItem {
  static readonly type: EdgeItem.Item['type'] = 'EDGE';
  private readonly keys: EdgeItem.Keys;

  constructor(private readonly attributes: EdgeItem.Attributes) {
    this.keys = {
      PK: EdgeItem.getPK(attributes.flowId),
      SK: EdgeItem.getSK(attributes.id),
    };
  }

  toItem(): EdgeItem.Item {
    return {
      ...this.keys,
      ...this.attributes,
      type: EdgeItem.type,
    };
  }

  static fromEntity(entity: EdgeEntity): EdgeItem {
    const attributes: EdgeItem.Attributes = {
      id: entity.attrs.id,
      sourceNodeId: entity.attrs.sourceNodeId,
      flowId: entity.attrs.flowId,
      targetNodeId: entity.attrs.targetNodeId,
      createdAt: entity.attrs.createdAt.toISOString(),
      updatedAt: entity.attrs.updatedAt.toISOString(),
    };
    return new EdgeItem(attributes);
  }

  static toEntity(item: EdgeItem.Item): EdgeEntity {
    return new EdgeEntity({
      id: item.id,
      sourceNodeId: item.sourceNodeId,
      targetNodeId: item.targetNodeId,
      flowId: item.flowId,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    });
  }

  static getPK(id: string): EdgeItem.Keys['PK'] {
    return `FLOW#${id}`;
  }

  static getSK(id: string): EdgeItem.Keys['SK'] {
    return `EDGE#${id}`;
  }
}

export namespace EdgeItem {
  export type Attributes = {
    id: string;
    sourceNodeId: string;
    flowId: string;
    targetNodeId: string;
    createdAt: string;
    updatedAt: string;
  };

  export type Keys = {
    PK: `FLOW#${string}`;
    SK: `EDGE#${string}`;
  };

  export type Item = Keys &
    Attributes & {
      type: 'EDGE';
    };
}
