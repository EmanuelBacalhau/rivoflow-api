import 'reflect-metadata';
import { DeleteFlowController } from '@application/controllers/flows/delete-flow.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(DeleteFlowController);
