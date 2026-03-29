import { AccountEntity } from '@application/entities/account.entity';
import { AccountBalanceEntity } from '@application/entities/account-balance.entity';
import { eq } from 'drizzle-orm';
import { Injectable } from 'src/kernel/decorators/injectable';
import { db, Transaction } from '../db';
import { accounts, accountBalances } from '../schema';

@Injectable()
export class AccountDrizzleRepository {
  async findById(id: string): Promise<AccountEntity | null> {
    const row = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
    if (!row[0]) return null;
    return this.toEntity(row[0]);
  }

  async findByEmail(email: string): Promise<AccountEntity | null> {
    const row = await db.select().from(accounts).where(eq(accounts.email, email)).limit(1);
    if (!row[0]) return null;
    return this.toEntity(row[0]);
  }

  async findByExternalId(externalId: string): Promise<AccountEntity | null> {
    const row = await db
      .select()
      .from(accounts)
      .where(eq(accounts.externalId, externalId))
      .limit(1);
    if (!row[0]) return null;
    return this.toEntity(row[0]);
  }

  async findByIdWithBalance(id: string): Promise<AccountEntity | null> {
    const result = await db
      .select()
      .from(accounts)
      .leftJoin(accountBalances, eq(accounts.id, accountBalances.accountId))
      .where(eq(accounts.id, id))
      .limit(1);

    if (!result[0]) return null;

    const entity = this.toEntity(result[0].accounts);

    if (result[0].account_balances) {
      entity.balance = this.toBalanceEntity(result[0].account_balances);
    }

    return entity;
  }

  async create(account: AccountEntity, tx?: Transaction): Promise<void> {
    const executor = tx ?? db;
    await executor.insert(accounts).values(this.toRow(account));
  }

  private toRow(entity: AccountEntity) {
    return {
      id: entity.attrs.id,
      email: entity.attrs.email,
      provider: entity.attrs.provider,
      externalId: entity.attrs.externalId,
      firstName: entity.attrs.firstName,
      lastName: entity.attrs.lastName,
      picture: entity.attrs.picture,
      isActive: entity.attrs.isActive,
      role: entity.attrs.role as 'USER' | 'ADMIN',
      createdAt: entity.attrs.createdAt,
      updatedAt: entity.attrs.updatedAt,
    };
  }

  private toEntity(row: typeof accounts.$inferSelect): AccountEntity {
    return new AccountEntity({
      id: row.id,
      email: row.email,
      provider: row.provider,
      externalId: row.externalId,
      firstName: row.firstName,
      lastName: row.lastName ?? undefined,
      picture: row.picture,
      isActive: row.isActive,
      role: row.role as AccountEntity.AccountRole,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toBalanceEntity(row: typeof accountBalances.$inferSelect): AccountBalanceEntity {
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
