import { AccountBalanceEntity } from '@application/entities/account-balance.entity';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';
import { AccountBalanceItem } from '../items/account-balance.item';

@Injectable()
export class AccountBalanceDynamoRepository {
  constructor(private readonly appConfig: AppConfig) {}

  async save(account: AccountBalanceEntity): Promise<void> {
    const item = AccountBalanceItem.fromEntity(account).toItem();
    const command = new PutCommand({
      TableName: this.appConfig.database.dynamoTable,
      Item: item,
    });

    await dynamoClient.send(command);
  }
}

export namespace AccountBalanceDynamoRepository {}
