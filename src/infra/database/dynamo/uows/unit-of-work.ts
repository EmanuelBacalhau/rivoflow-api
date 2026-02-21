import {
  DeleteCommand,
  DeleteCommandInput,
  PutCommand,
  PutCommandInput,
  TransactWriteCommand,
  TransactWriteCommandInput,
  UpdateCommand,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';

export abstract class UnitOfWork {
  private transactItems: NonNullable<TransactWriteCommandInput['TransactItems']> = [];

  protected addPut(put: PutCommandInput | DeleteCommandInput | UpdateCommandInput) {
    if (put instanceof PutCommand) {
      this.transactItems.push({
        Put: {
          TableName: put.input.TableName,
          Item: put.input.Item,
        },
      });
    }

    if (put instanceof DeleteCommand) {
      this.transactItems.push({
        Delete: {
          TableName: put.input.TableName,
          Key: put.input.Key,
        },
      });
    }

    if (put instanceof UpdateCommand) {
      this.transactItems.push({
        Update: {
          TableName: put.input.TableName,
          Key: put.input.Key,
          UpdateExpression: put.input.UpdateExpression,
          ExpressionAttributeValues: put.input.ExpressionAttributeValues,
        },
      });
    }
  }

  protected async commit() {
    if (this.transactItems.length === 0) return;

    const command = new TransactWriteCommand({
      TransactItems: this.transactItems,
    });

    await dynamoClient.send(command);
  }
}
