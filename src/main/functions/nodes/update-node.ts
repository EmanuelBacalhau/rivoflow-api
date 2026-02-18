import 'reflect-metadata';
import { UpdateNodeController } from '@application/controllers/nodes/update-node.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(UpdateNodeController);
