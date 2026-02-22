import {
  DeleteCommandInput,
  PutCommandInput,
  TransactWriteCommand,
  TransactWriteCommandInput,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';

export abstract class UnitOfWork {
  private transactItems: NonNullable<TransactWriteCommandInput['TransactItems']> = [];

  protected addPut(put: PutCommandInput) {
    this.transactItems.push({
      Put: {
        TableName: put.TableName,
        Item: put.Item,
      },
    });
  }

  protected addDelete(del: DeleteCommandInput) {
    this.transactItems.push({
      Delete: {
        TableName: del.TableName,
        Key: del.Key,
      },
    });
  }

  protected addUpdate(update: UpdateCommandInput) {
    this.transactItems.push({
      Update: {
        TableName: update.TableName,
        Key: update.Key,
        UpdateExpression: update.UpdateExpression,
        ExpressionAttributeValues: update.ExpressionAttributeValues,
        ExpressionAttributeNames: update.ExpressionAttributeNames,
      },
    });
  }

  protected async commit() {
    if (this.transactItems.length === 0) return;

    const command = new TransactWriteCommand({
      TransactItems: this.transactItems,
    });

    await dynamoClient.send(command);
  }
}
