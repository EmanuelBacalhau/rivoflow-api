import { AccountBalanceEntity } from '@application/entities/account-balance.entity';
import {
  PutCommand,
  PutCommandInput,
  QueryCommand,
  UpdateCommand,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';
import { AccountBalanceItem } from '../items/account-balance.item';

@Injectable()
export class AccountBalanceDynamoRepository {
  constructor(private readonly appConfig: AppConfig) {}

  async findByAccountId(accountId: string): Promise<AccountBalanceEntity | null> {
    const command = new QueryCommand({
      TableName: this.appConfig.database.dynamoTable,
      Limit: 1,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': AccountBalanceItem.getPK(accountId),
        ':sk': `${AccountBalanceItem.type}#`,
      },
    });

    const { Items = [] } = await dynamoClient.send(command);

    if (Items.length === 0) {
      return null;
    }

    return AccountBalanceItem.toEntity(Items[0] as AccountBalanceItem.Item);
  }

  async create(account: AccountBalanceEntity): Promise<void> {
    const command = new PutCommand(this.getPutCommandInput(account));
    await dynamoClient.send(command);
  }

  async update(account: AccountBalanceEntity): Promise<void> {
    const command = new UpdateCommand(this.getUpdateCommandInput(account));
    await dynamoClient.send(command);
  }

  getPutCommandInput(account: AccountBalanceEntity): PutCommandInput {
    const item = AccountBalanceItem.fromEntity(account).toItem();
    return {
      TableName: this.appConfig.database.dynamoTable,
      Item: item,
    };
  }

  getUpdateCommandInput(account: AccountBalanceEntity): UpdateCommandInput {
    const item = AccountBalanceItem.fromEntity(account);
    const keys = {
      PK: item.toItem().PK,
      SK: item.toItem().SK,
    };
    const updateExpressionParts: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(item.attributes).forEach(([key, value]) => {
      if (value !== undefined) {
        updateExpressionParts.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    return {
      TableName: this.appConfig.database.dynamoTable,
      Key: keys,
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    };
  }
}
