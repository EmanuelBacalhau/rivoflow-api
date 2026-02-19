import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { AccountBalanceEntity } from '@application/entities/account-balance.entity';
import { AccountBalanceDynamoRepository } from '@infra/database/dynamo/repositories/account-balance-dynamo.repository';
import { Injectable } from '@kernel/decorators/injectable';

interface CreateAccountBalanceInput {
  accountId: string;
  balance: number;
  lifetimeDeposited: number;
  lifetimeSpent: number;
}

@Injectable()
export class CreateAccountBalanceUseCase implements IUseCase<CreateAccountBalanceInput> {
  constructor(private readonly accountBalanceRepository: AccountBalanceDynamoRepository) {}

  async execute(input: CreateAccountBalanceInput): Promise<void> {
    const { accountId, balance, lifetimeDeposited, lifetimeSpent } = input;

    const accountBalance = new AccountBalanceEntity({
      accountId,
      balance,
      lifetimeDeposited,
      lifetimeSpent,
    });

    await this.accountBalanceRepository.save(accountBalance);
  }
}
