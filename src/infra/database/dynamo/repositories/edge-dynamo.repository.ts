import { EdgeEntity } from '@application/entities/edge.entity';
import { BatchWriteCommand, DeleteCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { Injectable } from 'src/kernel/decorators/injectable';
import { EdgeItem } from '../items/edge.item';

@Injectable()
export class EdgeDynamoRepository {
  async save(edge: EdgeEntity): Promise<void> {
    const item = EdgeItem.fromEntity(edge).toItem();
    const command = new PutCommand({
      TableName: process.env.DYNAMO_TABLE!,
      Item: item,
    });

    await dynamoClient.send(command);
  }

  async delete(flowId: string, edgeId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: process.env.DYNAMO_TABLE!,
      Key: {
        PK: EdgeItem.getPK(flowId),
        SK: EdgeItem.getSK(edgeId),
      },
    });

    await dynamoClient.send(command);
  }

  async deleteMany(params: EdgeDynamoRepository.DeleteManyInput): Promise<void> {
    const deleteRequests = params.map(({ flowId, edgeId }) => ({
      DeleteRequest: {
        Key: {
          PK: EdgeItem.getPK(flowId),
          SK: EdgeItem.getSK(edgeId),
        },
      },
    }));

    for (let i = 0; i < deleteRequests.length; i += 25) {
      const batch = deleteRequests.slice(i, i + 25);
      if (batch.length === 0) continue;

      const command = new BatchWriteCommand({
        RequestItems: {
          [process.env.DYNAMO_TABLE!]: batch,
        },
      });

      await dynamoClient.send(command);
    }
  }
}

export namespace EdgeDynamoRepository {
  export type DeleteManyInput = Array<{
    flowId: string;
    edgeId: string;
  }>;
}
