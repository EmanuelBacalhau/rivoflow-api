import { BaseEntity } from '@application/contracts/abstracts/base.entity';
import { Optional } from '@application/types/optional';
import { AccountBalanceEntity } from './account-balance.entity';

export class AccountEntity extends BaseEntity<AccountEntity.Attributes> {
  constructor(
    attrs: Optional<AccountEntity.Attributes, 'balance'> & Partial<BaseEntity.Attributes>,
  ) {
    super({
      ...attrs,
      balance:
        attrs.balance ||
        new AccountBalanceEntity({
          accountId: attrs.id || '',
          balance: 0,
          lifetimeDeposited: 0,
          lifetimeSpent: 0,
        }),
    });
  }
}

export namespace AccountEntity {
  export type Attributes = {
    email: string;
    provider: string;
    externalId: string;
    firstName: string;
    lastName?: string;
    picture: string;
    isActive: boolean;

    balance: AccountBalanceEntity;
  };

  export type AllAttributes = Attributes & BaseEntity.Attributes;
}
