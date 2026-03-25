import { AccountTransactionEntity } from '@application/entities/account-transaction.entity';
import { Injectable } from 'src/kernel/decorators/injectable';
import { db, Transaction } from '../db';
import { accountTransactions } from '../schema';

@Injectable()
export class AccountTransactionDrizzleRepository {
  async save(entity: AccountTransactionEntity, tx?: Transaction): Promise<void> {
    const executor = tx ?? db;
    await executor.insert(accountTransactions).values({
      id: entity.attrs.id,
      accountId: entity.attrs.accountId,
      type: entity.attrs.type,
      credits: entity.attrs.credits,
      metadata: entity.attrs.metadata,
      createdAt: entity.attrs.createdAt,
    });
  }
}
