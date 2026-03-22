import 'reflect-metadata';
import { GetNodeStatusController } from '@application/controllers/nodes/get-node-status.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(GetNodeStatusController);
