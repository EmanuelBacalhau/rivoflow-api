import { FlowEntity } from '@application/entities/flow.entity';

export class FlowItem {
  static readonly type: FlowItem.Item['type'] = 'FLOW';
  private readonly keys: FlowItem.Keys;

  constructor(private readonly attributes: FlowItem.Attributes) {
    this.keys = {
      PK: FlowItem.getPK(attributes.id),
      SK: FlowItem.getSK(attributes.id),
      ...FlowItem.buildGSI1Keys(attributes.accountId, attributes.createdAt),
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
      accountId: entity.attrs.accountId,
      createdAt: entity.attrs.createdAt.toISOString(),
      updatedAt: entity.attrs.updatedAt.toISOString(),
    };
    return new FlowItem(attributes);
  }

  static toEntity(item: FlowItem.Item): FlowEntity {
    return new FlowEntity({
      id: item.id,
      accountId: item.accountId,
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

  static buildGSI1Keys(accountId: string, createdAt: string): FlowItem.GSI1Keys {
    return {
      GSI1PK1: `FLOW#${accountId}`,
      GSI1SK1: `FLOW#${createdAt}`,
      GSI1SK2: `FLOW#_`,
      GSI1SK3: `FLOW#_`,
      GSI1SK4: `FLOW#_`,
    };
  }
}

export namespace FlowItem {
  export type Attributes = {
    id: string;
    title: string;
    accountId: string;
    createdAt: string;
    updatedAt: string;
  };

  export type GSI1Keys = {
    GSI1PK1: `FLOW#${string}`;
    GSI1SK1: `FLOW#${string}`;
    GSI1SK2: `FLOW#${string}`;
    GSI1SK3: `FLOW#${string}`;
    GSI1SK4: `FLOW#${string}`;
  };

  export type Keys = {
    PK: `FLOW#${string}`;
    SK: `FLOW#${string}`;
  } & GSI1Keys;

  export type Item = Keys &
    Attributes & {
      type: 'FLOW';
    };
}
