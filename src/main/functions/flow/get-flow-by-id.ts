import 'reflect-metadata';
import { GetFlowByIdUseCaseUseCase } from '@application/use-cases/flow/get-flow-by-id.use-case';
import { FlowDynamoRepository } from '@infra/database/dynamo/repositories/flow-dynamo.repository';
import { FileStorageGateway } from '@infra/gateways/aws/FileStorageGateway';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

export async function handler(event: APIGatewayProxyEventV2) {
  const flowIdParams = event.pathParameters?.flowId;

  const useCase = new GetFlowByIdUseCaseUseCase(
    new FlowDynamoRepository(),
    new FileStorageGateway(),
  );
  const result = await useCase.execute({
    flowId: flowIdParams || '',
  });

  return {
    statusCode: 201,
    body: JSON.stringify(result),
  };
}
