import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { AccountEntity } from '@application/entities/account.entity';
import { AccountBalanceEntity } from '@application/entities/account-balance.entity';
import { CreateAccountUnitOfWork } from '@infra/database/dynamo/uows/create-account.uow';
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
  constructor(private readonly createAccountUOW: CreateAccountUnitOfWork) {}

  async execute(params: CreateAccountUseCaseInput): Promise<CreateAccountUseCaseOutput> {
    const account = new AccountEntity({
      email: params.email,
      provider: params.provider,
      externalId: params.externalId,
      firstName: params.givenName,
      lastName: params.familyName,
      picture: params.picture,
      isActive: true,
    });

    const accountBalance = new AccountBalanceEntity({
      accountId: account.attrs.id,
      balance: 0,
      lifetimeDeposited: 0,
      lifetimeSpent: 0,
    });

    await this.createAccountUOW.run({
      account,
      accountBalance,
    });

    return account;
  }
}
