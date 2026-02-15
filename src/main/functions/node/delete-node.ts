import 'reflect-metadata';
import { DeleteNodeController } from '@application/controllers/nodes/delete-node.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(DeleteNodeController);
