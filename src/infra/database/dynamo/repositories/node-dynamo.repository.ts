import { NodeEntity } from '@application/entities/node.entity';
import {
  BatchGetCommand,
  DeleteCommand,
  DeleteCommandInput,
  GetCommand,
  PutCommand,
  UpdateCommand,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';
import { NodeItem } from '../items/node.item';

@Injectable()
export class NodeDynamoRepository {
  constructor(private readonly appConfig: AppConfig) {}

  async save(node: NodeEntity): Promise<void> {
    const item = NodeItem.fromEntity(node).toItem();
    const command = new PutCommand({
      TableName: this.appConfig.database.dynamoTable,
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
        [this.appConfig.database.dynamoTable]: {
          Keys: keys,
        },
      },
    });

    const { Responses } = await dynamoClient.send(command);

    if (!Responses?.[this.appConfig.database.dynamoTable]) return [];

    const nodes = Responses[this.appConfig.database.dynamoTable];

    return nodes.map((item) => NodeItem.toEntity(item as NodeItem.Item));
  }

  async findById(nodeId: string, flowId: string): Promise<NodeEntity | null> {
    const command = new GetCommand({
      TableName: this.appConfig.database.dynamoTable,
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
    const command = new UpdateCommand(this.getUpdateCommandInput(node));
    await dynamoClient.send(command);
  }

  async delete(params: NodeDynamoRepository.DeleteInput): Promise<void> {
    const command = new DeleteCommand(this.getDeleteCommandInput(params));

    await dynamoClient.send(command);
  }

  getDeleteCommandInput(params: NodeDynamoRepository.DeleteInput): DeleteCommandInput {
    const { flowId, nodeId } = params;
    return {
      TableName: this.appConfig.database.dynamoTable,
      Key: {
        PK: NodeItem.getPK(flowId),
        SK: NodeItem.getSK(nodeId),
      },
    };
  }

  getUpdateCommandInput(node: NodeEntity): UpdateCommandInput {
    const item = NodeItem.fromEntity(node);
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

export namespace NodeDynamoRepository {
  export type FindNodesByIdsParams = {
    flowId: string;
    nodeIds: string[];
  };

  export type FindNodesByIdOutput = NodeEntity[];

  export type DeleteInput = {
    flowId: string;
    nodeId: string;
  };
}
