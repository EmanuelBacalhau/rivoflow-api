import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { AccountEntity } from '@application/entities/account.entity';
import { AccountBalanceEntity } from '@application/entities/account-balance.entity';
import { AccountBalanceDrizzleRepository } from '@infra/database/drizzle/repositories/account-balance-drizzle.repository';
import { AccountDrizzleRepository } from '@infra/database/drizzle/repositories/account-drizzle.repository';
import { DrizzleTransaction } from '@infra/database/drizzle/drizzle-transaction';
import { Injectable } from 'src/kernel/decorators/injectable';

type CreateAccountUseCaseInput = {
  familyName: string;
  givenName: string;
  email: string;
  picture: string;
  provider: string;
  externalId: string;
};

type CreateAccountUseCaseOutput = AccountEntity;

@Injectable()
export class CreateAccountUseCase
  implements IUseCase<CreateAccountUseCaseInput, CreateAccountUseCaseOutput>
{
  constructor(
    private readonly accountRepository: AccountDrizzleRepository,
    private readonly accountBalanceRepository: AccountBalanceDrizzleRepository,
    private readonly transactWrite: DrizzleTransaction,
  ) {}

  async execute(params: CreateAccountUseCaseInput): Promise<CreateAccountUseCaseOutput> {
    const existingAccount = await this.accountRepository.findByEmail(params.email);

    if (existingAccount) {
      return existingAccount;
    }

    const account = new AccountEntity({
      email: params.email,
      provider: params.provider,
      externalId: params.externalId,
      firstName: params.givenName,
      lastName: params.familyName,
      picture: params.picture,
      isActive: true,
      role: AccountEntity.AccountRole.USER,
    });

    const accountBalance = new AccountBalanceEntity({
      accountId: account.attrs.id,
      balance: 0,
      lifetimeDeposited: 0,
      lifetimeSpent: 0,
    });

    await this.transactWrite.execute(async (tx) => {
      await this.accountRepository.create(account, tx);
      await this.accountBalanceRepository.create(accountBalance, tx);
    });

    return account;
  }
}
