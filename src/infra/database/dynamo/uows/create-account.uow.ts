import { AccountEntity } from '@application/entities/account.entity';
import { AccountBalanceEntity } from '@application/entities/account-balance.entity';
import { Injectable } from '@kernel/decorators/injectable';
import { AccountBalanceDynamoRepository } from '../repositories/account-balance-dynamo.repository';
import { AccountDynamoRepository } from '../repositories/account-dynamo.repository';
import { UnitOfWork } from './unit-of-work';

@Injectable()
export class CreateAccountUnitOfWork extends UnitOfWork {
  constructor(
    private readonly accountRepository: AccountDynamoRepository,
    private readonly accountBalanceRepository: AccountBalanceDynamoRepository,
  ) {
    super();
  }

  async run(input: CreateAccountUnitOfWork.Input): Promise<void> {
    const { account, accountBalance } = input;

    this.addPut(this.accountRepository.getPutCommandInput(account));
    this.addPut(this.accountBalanceRepository.getPutCommandInput(accountBalance));

    await this.commit();
  }
}

export namespace CreateAccountUnitOfWork {
  export interface Input {
    account: AccountEntity;
    accountBalance: AccountBalanceEntity;
  }
}
