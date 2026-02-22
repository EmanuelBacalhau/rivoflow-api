import { AccountEntity } from '@application/entities/account.entity';
import { GetCommand, PutCommand, PutCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';
import { AccountItem } from '../items/account.item';
import { AccountBalanceItem } from '../items/account-balance.item';

@Injectable()
export class AccountDynamoRepository {
  constructor(private readonly appConfig: AppConfig) {}

  async findById(id: string): Promise<AccountEntity | null> {
    const command = new GetCommand({
      TableName: this.appConfig.database.dynamoTable,
      Key: {
        PK: AccountItem.getPK(id),
        SK: AccountItem.getSK(id),
      },
    });

    const { Item } = await dynamoClient.send(command);

    if (!Item) {
      return null;
    }

    return AccountItem.toEntity(Item as AccountItem.Item);
  }

  async findByEmail(
    params: AccountDynamoRepository.FindByEmailInput,
  ): Promise<AccountEntity | null> {
    const { email } = params;

    const { GSI1PK1 } = AccountItem.buildGSI1Keys(email, '');

    const command = new QueryCommand({
      TableName: this.appConfig.database.dynamoTable,
      IndexName: 'GSI1',
      Limit: 1,
      KeyConditionExpression: 'GSI1PK1 = :pk1',
      ExpressionAttributeValues: {
        ':pk1': GSI1PK1,
      },
    });

    const result = await dynamoClient.send(command);

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return AccountItem.toEntity(result.Items[0] as AccountItem.Item);
  }

  async findByIdWithBalance(id: string): Promise<AccountEntity | null> {
    const command = new QueryCommand({
      TableName: this.appConfig.database.dynamoTable,
      KeyConditionExpression: 'PK = :PK',
      ExpressionAttributeValues: {
        ':PK': AccountItem.getPK(id),
      },
    });

    const { Items = [] } = await dynamoClient.send(command);

    const accountRaw = Items.find((item) => item.type === AccountItem.type);
    const balanceRaw = Items.find((item) => item.type === AccountBalanceItem.type);

    if (!accountRaw) return null;

    const entity = AccountItem.toEntity(accountRaw as AccountItem.Item);
    if (balanceRaw) {
      entity.balance = AccountBalanceItem.toEntity(balanceRaw as AccountBalanceItem.Item);
    }

    return entity;
  }

  async create(account: AccountEntity): Promise<void> {
    const command = new PutCommand(this.getPutCommandInput(account));
    await dynamoClient.send(command);
  }

  getPutCommandInput(account: AccountEntity): PutCommandInput {
    const item = AccountItem.fromEntity(account).toItem();
    return {
      TableName: this.appConfig.database.dynamoTable,
      Item: item,
    };
  }
}

export namespace AccountDynamoRepository {
  export type FindByEmailInput = {
    email: string;
  };
}
