import 'reflect-metadata';
import { CreateRemoveBgNodeController } from '@application/controllers/nodes/create-remove-bg-node.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(CreateRemoveBgNodeController);
