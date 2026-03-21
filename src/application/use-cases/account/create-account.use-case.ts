import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { AccountEntity } from '@application/entities/account.entity';
import { AccountBalanceEntity } from '@application/entities/account-balance.entity';
import { AccountBalanceDynamoRepository } from '@infra/database/dynamo/repositories/account-balance-dynamo.repository';
import { AccountDynamoRepository } from '@infra/database/dynamo/repositories/account-dynamo.repository';
import { TransactWrite } from '@infra/database/dynamo/transact-write';
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
    private readonly accountRepository: AccountDynamoRepository,
    private readonly accountBalanceRepository: AccountBalanceDynamoRepository,
  ) {}

  async execute(params: CreateAccountUseCaseInput): Promise<CreateAccountUseCaseOutput> {
    const existingAccount = await this.accountRepository.findByEmail({
      email: params.email,
    });

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

    await new TransactWrite()
      .addPut(this.accountRepository.getPutCommandInput(account))
      .addPut(this.accountBalanceRepository.getPutCommandInput(accountBalance))
      .commit();

    return account;
  }
}
