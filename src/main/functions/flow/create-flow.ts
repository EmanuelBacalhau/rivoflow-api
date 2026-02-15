import 'reflect-metadata';

import { CreateFlowUseCase } from '@application/use-cases/flow/create-flow.use-case';
import { FlowDynamoRepository } from '@infra/database/dynamo/repositories/flow-dynamo.repository';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

export async function handler(event: APIGatewayProxyEventV2) {
  const body = JSON.parse(event.body || '{}');
  const projectId = '';
  const title = body.title || 'Untitled Flow';

  const useCase = new CreateFlowUseCase(new FlowDynamoRepository());
  const result = await useCase.execute({
    title,
    projectId,
  });

  return {
    statusCode: 201,
    body: JSON.stringify(result),
  };
}
