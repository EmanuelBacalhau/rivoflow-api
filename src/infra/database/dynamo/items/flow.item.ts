import { FlowEntity } from '@application/entities/flow.entity';

export class FlowItem {
  static readonly type: FlowItem.Item['type'] = 'FLOW';
  private readonly keys: FlowItem.Keys;

  constructor(private readonly attributes: FlowItem.Attributes) {
    this.keys = {
      PK: FlowItem.getPK(attributes.id),
      SK: FlowItem.getSK(attributes.id),
    };
  }

  toItem(): FlowItem.Item {
    return {
      ...this.keys,
      ...this.attributes,
      type: FlowItem.type,
    };
  }

  static fromEntity(entity: FlowEntity): FlowItem {
    const attributes: FlowItem.Attributes = {
      id: entity.attrs.id,
      title: entity.attrs.title,
      projectId: entity.attrs.projectId,
      createdAt: entity.attrs.createdAt.toISOString(),
      updatedAt: entity.attrs.updatedAt.toISOString(),
    };
    return new FlowItem(attributes);
  }

  static toEntity(item: FlowItem.Item): FlowEntity {
    return new FlowEntity({
      id: item.id,
      projectId: item.projectId,
      title: item.title,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    });
  }

  static getSK(id: string): FlowItem.Keys['SK'] {
    return `FLOW#${id}`;
  }

  static getPK(id: string): FlowItem.Keys['PK'] {
    return `FLOW#${id}`;
  }
}

export namespace FlowItem {
  export type Attributes = {
    id: string;
    title: string;
    projectId: string;
    createdAt: string;
    updatedAt: string;
  };

  export type Keys = {
    PK: `FLOW#${string}`;
    SK: `FLOW#${string}`;
  };

  export type Item = Keys &
    Attributes & {
      type: 'FLOW';
    };
}
