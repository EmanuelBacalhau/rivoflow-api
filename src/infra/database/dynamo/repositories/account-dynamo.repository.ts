import { AccountEntity } from '@application/entities/account.entity';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';
import { AccountItem } from '../items/account.item';

@Injectable()
export class AccountDynamoRepository {
  constructor(private readonly appConfig: AppConfig) {}

  async findByEmail(
    params: AccountDynamoRepository.FindByEmailInput,
  ): Promise<AccountEntity | null> {
    const { email } = params;

    const command = new QueryCommand({
      TableName: this.appConfig.database.dynamoTable,
      IndexName: 'GSI1',
      Limit: 1,
      KeyConditionExpression: '#GSI1PK = :GSI1PK',
      ExpressionAttributeNames: {
        '#GSI1PK': 'GSI1PK',
      },
      ExpressionAttributeValues: {
        ':GSI1PK': AccountItem.getGSI1PK(email),
      },
    });

    const result = await dynamoClient.send(command);

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return AccountItem.toEntity(result.Items[0] as AccountItem.Item);
  }

  async save(account: AccountEntity): Promise<void> {
    const item = AccountItem.fromEntity(account).toItem();
    const command = new PutCommand({
      TableName: this.appConfig.database.dynamoTable,
      Item: item,
    });

    await dynamoClient.send(command);
  }
}

export namespace AccountDynamoRepository {
  export type FindByEmailInput = {
    email: string;
  };
}
