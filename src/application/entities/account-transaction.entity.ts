import { BaseEntity } from '@application/contracts/abstracts/base.entity';

export class AccountTransactionEntity extends BaseEntity<AccountTransactionEntity.Attributes> {}

export namespace AccountTransactionEntity {
  export enum Type {
    DEPOSIT = 'DEPOSIT',
    DEBIT = 'DEBIT',
  }

  export type DepositMetadata = {
    amountBrl: number;
    amountUsd: number;
    exchangeRate: number;
    paymentMethod?: string;
    billingId?: string;
  };

  export type DebitMetadata = {
    nodeId: string;
    nodeType: string;
    flowId: string;
    costUsd: number;
  };

  export type Attributes = {
    accountId: string;
    type: Type;
    credits: number;
    metadata: DepositMetadata | DebitMetadata | null;
  };

  export type AllAttributes = Attributes & BaseEntity.Attributes;
}
