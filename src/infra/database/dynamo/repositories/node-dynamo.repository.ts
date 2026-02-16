import { NodeEntity } from '@application/entities/node.entity';
import {
  BatchGetCommand,
  DeleteCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { Injectable } from 'src/kernel/decorators/injectable';
import { NodeItem } from '../items/node.item';

@Injectable()
export class NodeDynamoRepository {
  async save(node: NodeEntity): Promise<void> {
    const item = NodeItem.fromEntity(node).toItem();
    const command = new PutCommand({
      TableName: process.env.DYNAMO_TABLE!,
      Item: item,
    });

    await dynamoClient.send(command);
  }

  async findNodesByIds(params: NodeDynamoRepository.FindNodesByIdsParams) {
    const { flowId, nodeIds } = params;

    const keys = nodeIds.map((nodeId) => ({
      PK: NodeItem.getPK(flowId),
      SK: NodeItem.getSK(nodeId),
    }));

    const command = new BatchGetCommand({
      RequestItems: {
        [process.env.DYNAMO_TABLE!]: {
          Keys: keys,
        },
      },
    });

    const { Responses } = await dynamoClient.send(command);

    if (!Responses?.[process.env.DYNAMO_TABLE!]) return [];

    const nodes = Responses[process.env.DYNAMO_TABLE!];

    return nodes.map((item) => NodeItem.toEntity(item as NodeItem.Item));
  }

  async findById(nodeId: string, flowId: string): Promise<NodeEntity | null> {
    const command = new GetCommand({
      TableName: process.env.DYNAMO_TABLE!,
      Key: {
        PK: NodeItem.getPK(flowId),
        SK: NodeItem.getSK(nodeId),
      },
    });

    const result = await dynamoClient.send(command);
    if (!result.Item) return null;

    return NodeItem.toEntity(result.Item as NodeItem.Item);
  }

  async update(node: NodeEntity): Promise<void> {
    const item = NodeItem.fromEntity(node).toItem();
    const command = new UpdateCommand({
      TableName: process.env.DYNAMO_TABLE!,
      Key: {
        PK: item.PK,
        SK: item.SK,
      },
      UpdateExpression:
        'SET #data = :data, #isExecuted = :isExecuted, #updatedAt = :updatedAt, #position = :position',
      ExpressionAttributeNames: {
        '#data': 'data',
        '#isExecuted': 'isExecuted',
        '#updatedAt': 'updatedAt',
        '#position': 'position',
      },
      ExpressionAttributeValues: {
        ':data': item.data,
        ':isExecuted': item.isExecuted,
        ':updatedAt': item.updatedAt,
        ':position': item.position,
      },
    });
    await dynamoClient.send(command);
  }

  async delete(flowId: string, nodeId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: process.env.DYNAMO_TABLE!,
      Key: {
        PK: NodeItem.getPK(flowId),
        SK: NodeItem.getSK(nodeId),
      },
    });

    await dynamoClient.send(command);
  }
}

export namespace NodeDynamoRepository {
  export type FindNodesByIdsParams = {
    flowId: string;
    nodeIds: string[];
  };

  export type FindNodesByIdOutput = NodeEntity[];
}
