import 'reflect-metadata';
import { CreateVideoNodeController } from '@application/controllers/nodes/create-video-node.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(CreateVideoNodeController);
