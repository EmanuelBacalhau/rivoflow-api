import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { AccountEntity } from '@application/entities/account.entity';
import { AccountDynamoRepository } from '@infra/database/dynamo/repositories/account-dynamo.repository';
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
  constructor(private readonly accountRepository: AccountDynamoRepository) {}

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

    await this.accountRepository.save(account);

    return account;
  }
}
