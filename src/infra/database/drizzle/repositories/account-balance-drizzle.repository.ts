import { AccountBalanceEntity } from '@application/entities/account-balance.entity';
import { eq } from 'drizzle-orm';
import { Injectable } from 'src/kernel/decorators/injectable';
import { db, Transaction } from '../db';
import { accountBalances } from '../schema';

@Injectable()
export class AccountBalanceDrizzleRepository {
  async findByAccountId(accountId: string, tx?: Transaction): Promise<AccountBalanceEntity | null> {
    const executor = tx ?? db;
    const row = await executor
      .select()
      .from(accountBalances)
      .where(eq(accountBalances.accountId, accountId))
      .limit(1);

    if (!row[0]) return null;
    return this.toEntity(row[0]);
  }

  async create(entity: AccountBalanceEntity, tx?: Transaction): Promise<void> {
    const executor = tx ?? db;
    await executor.insert(accountBalances).values(this.toRow(entity));
  }

  async update(entity: AccountBalanceEntity, tx?: Transaction): Promise<void> {
    const executor = tx ?? db;
    await executor
      .update(accountBalances)
      .set({
        balance: entity.attrs.balance,
        lifetimeDeposited: entity.attrs.lifetimeDeposited,
        lifetimeSpent: entity.attrs.lifetimeSpent,
        updatedAt: entity.attrs.updatedAt,
      })
      .where(eq(accountBalances.id, entity.attrs.id));
  }

  private toRow(entity: AccountBalanceEntity) {
    return {
      id: entity.attrs.id,
      accountId: entity.attrs.accountId,
      balance: entity.attrs.balance,
      lifetimeDeposited: entity.attrs.lifetimeDeposited,
      lifetimeSpent: entity.attrs.lifetimeSpent,
      createdAt: entity.attrs.createdAt,
      updatedAt: entity.attrs.updatedAt,
    };
  }

  private toEntity(row: typeof accountBalances.$inferSelect): AccountBalanceEntity {
    return new AccountBalanceEntity({
      id: row.id,
      accountId: row.accountId,
      balance: row.balance,
      lifetimeDeposited: row.lifetimeDeposited,
      lifetimeSpent: row.lifetimeSpent,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
