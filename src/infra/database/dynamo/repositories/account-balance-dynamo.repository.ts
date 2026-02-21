import { AccountBalanceEntity } from '@application/entities/account-balance.entity';
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';
import { AccountBalanceItem } from '../items/account-balance.item';

@Injectable()
export class AccountBalanceDynamoRepository {
  constructor(private readonly appConfig: AppConfig) {}

  async create(account: AccountBalanceEntity): Promise<void> {
    const command = new PutCommand(this.getPutCommandInput(account));
    await dynamoClient.send(command);
  }

  getPutCommandInput(account: AccountBalanceEntity): PutCommandInput {
    const item = AccountBalanceItem.fromEntity(account).toItem();
    return {
      TableName: this.appConfig.database.dynamoTable,
      Item: item,
    };
  }
}
