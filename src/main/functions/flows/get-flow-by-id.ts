import 'reflect-metadata';
import 'reflect-metadata';
import { GetFlowByIdController } from '@application/controllers/flows/get-flow-by-id.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(GetFlowByIdController);
