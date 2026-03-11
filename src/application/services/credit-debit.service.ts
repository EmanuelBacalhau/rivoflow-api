import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { AccountBalanceDynamoRepository } from '@infra/database/dynamo/repositories/account-balance-dynamo.repository';
import { Injectable } from 'src/kernel/decorators/injectable';

@Injectable()
export class CreditDebitService {
  constructor(private readonly accountBalanceRepository: AccountBalanceDynamoRepository) {}

  async debitAccount(accountId: string, consumedCredits: number) {
    const accountBalance = await this.accountBalanceRepository.findByAccountId(accountId);

    if (!accountBalance) {
      throw new ResourceNotFoundError('Account balance not found');
    }

    accountBalance.updateAttributes({
      balance: accountBalance.attrs.balance - consumedCredits,
      lifetimeSpent: (accountBalance.attrs.lifetimeSpent || 0) + consumedCredits,
    });

    await this.accountBalanceRepository.update(accountBalance);

    return accountBalance;
  }
}
