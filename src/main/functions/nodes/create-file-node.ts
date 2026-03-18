import 'reflect-metadata';
import { CreateFileNodeController } from '@application/controllers/nodes/create-file-node.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(CreateFileNodeController);
