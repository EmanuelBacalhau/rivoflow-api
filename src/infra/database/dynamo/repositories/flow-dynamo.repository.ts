import { FlowEntity } from '@application/entities/flow.entity';
import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';
import { EdgeItem } from '../items/edge.item';
import { FlowItem } from '../items/flow.item';
import { NodeItem } from '../items/node.item';

@Injectable()
export class FlowDynamoRepository {
  constructor(private readonly appConfig: AppConfig) {}

  async findFlowAndNodesAndEdgesById(id: string): Promise<FlowEntity | null> {
    const command = new QueryCommand({
      TableName: this.appConfig.database.dynamoTable,
      KeyConditionExpression: 'PK = :PK',
      ExpressionAttributeValues: {
        ':PK': FlowItem.getPK(id),
      },
    });

    const { Items = [] } = await dynamoClient.send(command);

    const flow = Items.find((item) => item.type === FlowItem.type);
    const nodes = Items.filter((item) => item.type === NodeItem.type);
    const edges = Items.filter((item) => item.type === EdgeItem.type);

    const entity = FlowItem.toEntity(flow as FlowItem.Item);
    entity.nodes = nodes.map((node) => NodeItem.toEntity(node as NodeItem.Item));
    entity.edges = edges.map((edge) => EdgeItem.toEntity(edge as EdgeItem.Item));

    return entity;
  }

  async findById(id: string): Promise<FlowEntity | null> {
    const command = new GetCommand({
      TableName: this.appConfig.database.dynamoTable,
      Key: {
        PK: FlowItem.getPK(id),
        SK: FlowItem.getSK(id),
      },
    });

    const { Item } = await dynamoClient.send(command);

    if (!Item) {
      return null;
    }

    return FlowItem.toEntity(Item as FlowItem.Item);
  }

  async findByAccountId(accountId: string): Promise<FlowEntity[]> {
    const { GSI1PK1 } = FlowItem.buildGSI1Keys(accountId, '');

    const command = new QueryCommand({
      TableName: this.appConfig.database.dynamoTable,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK1 = :pk1',
      ExpressionAttributeValues: {
        ':pk1': GSI1PK1,
      },
      ScanIndexForward: false,
    });

    const { Items = [] } = await dynamoClient.send(command);

    return Items.map((item) => FlowItem.toEntity(item as FlowItem.Item));
  }

  async save(flow: FlowEntity): Promise<void> {
    const item = FlowItem.fromEntity(flow).toItem();
    const command = new PutCommand({
      TableName: this.appConfig.database.dynamoTable,
      Item: item,
    });

    await dynamoClient.send(command);
  }
}
