import 'reflect-metadata';
import { CreateNodeController } from '@application/controllers/nodes/create-node.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(CreateNodeController);
