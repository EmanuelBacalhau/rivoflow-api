import { AccountEntity, AccountRole } from '@application/entities/account.entity';

export class AccountItem {
  static readonly type: AccountItem.Item['type'] = 'ACCOUNT';
  private readonly keys: AccountItem.Keys;

  constructor(private readonly attributes: AccountItem.Attributes) {
    this.keys = {
      PK: AccountItem.getPK(attributes.id),
      SK: AccountItem.getSK(attributes.id),
      ...AccountItem.buildGSI1Keys(attributes.email, attributes.id),
    };
  }

  toItem(): AccountItem.Item {
    return {
      ...this.keys,
      ...this.attributes,
      type: AccountItem.type,
    };
  }

  static fromEntity(entity: AccountEntity): AccountItem {
    const attributes: AccountItem.Attributes = {
      id: entity.attrs.id,
      email: entity.attrs.email,
      provider: entity.attrs.provider,
      externalId: entity.attrs.externalId,
      firstName: entity.attrs.firstName,
      lastName: entity.attrs.lastName,
      picture: entity.attrs.picture,
      isActive: entity.attrs.isActive,
      role: entity.attrs.role,
      createdAt: entity.attrs.createdAt.toISOString(),
      updatedAt: entity.attrs.updatedAt.toISOString(),
    };
    return new AccountItem(attributes);
  }

  static toEntity(item: AccountItem.Item): AccountEntity {
    return new AccountEntity({
      id: item.id,
      email: item.email,
      provider: item.provider,
      externalId: item.externalId,
      firstName: item.firstName,
      lastName: item.lastName,
      picture: item.picture,
      isActive: item.isActive,
      role: item.role,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    });
  }

  static getPK(id: string): AccountItem.Keys['PK'] {
    return `ACCOUNT#${id}`;
  }

  static getSK(id: string): AccountItem.Keys['SK'] {
    return `ACCOUNT#${id}`;
  }

  static buildGSI1Keys(email: string, id: string): AccountItem.GSI1Keys {
    return {
      GSI1PK1: `ACCOUNT#${email}`,
      GSI1SK1: `ACCOUNT#${id}`,
      GSI1SK2: `ACCOUNT#_`,
      GSI1SK3: `ACCOUNT#_`,
      GSI1SK4: `ACCOUNT#_`,
    };
  }
}

export namespace AccountItem {
  export type Attributes = {
    id: string;
    email: string;
    provider: string;
    externalId: string;
    firstName: string;
    lastName?: string;
    picture: string;
    isActive: boolean;
    role: AccountRole;
    createdAt: string;
    updatedAt: string;
  };

  export type GSI1Keys = {
    GSI1PK1: `ACCOUNT#${string}`;
    GSI1SK1: `ACCOUNT#${string}`;
    GSI1SK2: `ACCOUNT#${string}`;
    GSI1SK3: `ACCOUNT#${string}`;
    GSI1SK4: `ACCOUNT#${string}`;
  };

  export type Keys = {
    PK: `ACCOUNT#${string}`;
    SK: `ACCOUNT#${string}`;
  } & GSI1Keys;

  export type Item = Keys &
    Attributes & {
      type: 'ACCOUNT';
    };
}
