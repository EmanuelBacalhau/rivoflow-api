import { EdgeEntity } from '@application/entities/edge.entity';
import { DeleteCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';
import { EdgeItem } from '../items/edge.item';

@Injectable()
export class EdgeDynamoRepository {
  constructor(private readonly appConfig: AppConfig) {}

  async findById(params: EdgeDynamoRepository.FindByIdInput): Promise<EdgeEntity | null> {
    const { flowId, edgeId } = params;
    const command = new GetCommand({
      TableName: this.appConfig.database.dynamoTable,
      Key: {
        PK: EdgeItem.getPK(flowId),
        SK: EdgeItem.getSK(edgeId),
      },
    });

    const result = await dynamoClient.send(command);

    if (!result.Item) {
      return null;
    }

    return EdgeItem.toEntity(result.Item as EdgeItem.Item);
  }

  async save(edge: EdgeEntity): Promise<void> {
    const item = EdgeItem.fromEntity(edge).toItem();
    const command = new PutCommand({
      TableName: this.appConfig.database.dynamoTable,
      Item: item,
    });

    await dynamoClient.send(command);
  }

  async delete(params: EdgeDynamoRepository.DeleteInput): Promise<void> {
    const { flowId, edgeId } = params;
    const command = new DeleteCommand({
      TableName: this.appConfig.database.dynamoTable,
      Key: {
        PK: EdgeItem.getPK(flowId),
        SK: EdgeItem.getSK(edgeId),
      },
    });

    await dynamoClient.send(command);
  }
}

export namespace EdgeDynamoRepository {
  export type FindByIdInput = {
    flowId: string;
    edgeId: string;
  };

  export type DeleteInput = {
    flowId: string;
    edgeId: string;
  };
}
