import {
  DeleteCommandInput,
  PutCommandInput,
  TransactWriteCommand,
  TransactWriteCommandInput,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';

type TransactOperation =
  | { put: PutCommandInput }
  | { update: UpdateCommandInput }
  | { delete: DeleteCommandInput };

export class TransactWrite {
  private operations: TransactOperation[] = [];

  addPut(put: PutCommandInput): this {
    this.operations.push({ put });
    return this;
  }

  addUpdate(update: UpdateCommandInput): this {
    this.operations.push({ update });
    return this;
  }

  addDelete(del: DeleteCommandInput): this {
    this.operations.push({ delete: del });
    return this;
  }

  async commit(): Promise<void> {
    if (this.operations.length === 0) return;

    const transactItems: NonNullable<TransactWriteCommandInput['TransactItems']> =
      this.operations.map((op) => {
        if ('put' in op) {
          return {
            Put: {
              TableName: op.put.TableName,
              Item: op.put.Item,
            },
          };
        }
        if ('update' in op) {
          return {
            Update: {
              TableName: op.update.TableName,
              Key: op.update.Key,
              UpdateExpression: op.update.UpdateExpression,
              ExpressionAttributeValues: op.update.ExpressionAttributeValues,
              ExpressionAttributeNames: op.update.ExpressionAttributeNames,
            },
          };
        }
        return {
          Delete: {
            TableName: op.delete.TableName,
            Key: op.delete.Key,
          },
        };
      });

    await dynamoClient.send(new TransactWriteCommand({ TransactItems: transactItems }));
  }
}
