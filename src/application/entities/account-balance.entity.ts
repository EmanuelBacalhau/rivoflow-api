import { BaseEntity } from '@application/contracts/abstracts/base.entity';

export class AccountBalanceEntity extends BaseEntity<AccountBalanceEntity.Attributes> {}

export namespace AccountBalanceEntity {
  export type Attributes = {
    accountId: string;
    balance: number;
    lifetimeDeposited: number;
    lifetimeSpent: number;
  };

  export type AllAttributes = Attributes & BaseEntity.Attributes;
}
