import { AccountBalanceEntity } from '@application/entities/account-balance.entity';

export class AccountBalanceItem {
  static readonly type: AccountBalanceItem.Item['type'] = 'ACCOUNT_BALANCE';
  private readonly keys: AccountBalanceItem.Keys;

  constructor(private readonly attributes: AccountBalanceItem.Attributes) {
    this.keys = {
      PK: AccountBalanceItem.getPK(attributes.accountId),
      SK: AccountBalanceItem.getSK(attributes.id),
    };
  }

  toItem(): AccountBalanceItem.Item {
    return {
      ...this.keys,
      ...this.attributes,
      type: AccountBalanceItem.type,
    };
  }

  static fromEntity(entity: AccountBalanceEntity): AccountBalanceItem {
    const attributes: AccountBalanceItem.Attributes = {
      id: entity.attrs.id,
      accountId: entity.attrs.accountId,
      balance: entity.attrs.balance,
      lifetimeDeposited: entity.attrs.lifetimeDeposited,
      lifetimeSpent: entity.attrs.lifetimeSpent,
      createdAt: entity.attrs.createdAt.toISOString(),
      updatedAt: entity.attrs.updatedAt.toISOString(),
    };
    return new AccountBalanceItem(attributes);
  }

  static toEntity(item: AccountBalanceItem.Item): AccountBalanceEntity {
    return new AccountBalanceEntity({
      id: item.id,
      accountId: item.accountId,
      balance: item.balance,
      lifetimeDeposited: item.lifetimeDeposited,
      lifetimeSpent: item.lifetimeSpent,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    });
  }

  static getPK(id: string): AccountBalanceItem.Keys['PK'] {
    return `ACCOUNT#${id}`;
  }

  static getSK(id: string): AccountBalanceItem.Keys['SK'] {
    return `ACCOUNT_BALANCE#${id}`;
  }
}

export namespace AccountBalanceItem {
  export type Attributes = {
    id: string;
    accountId: string;
    balance: number;
    lifetimeDeposited: number;
    lifetimeSpent: number;
    createdAt: string;
    updatedAt: string;
  };

  export type Keys = {
    PK: `ACCOUNT#${string}`;
    SK: `ACCOUNT_BALANCE#${string}`;
  };

  export type Item = Keys &
    Attributes & {
      type: 'ACCOUNT_BALANCE';
    };
}
