import 'reflect-metadata';
import { CreateTextToImageNodeController } from '@application/controllers/nodes/create-text-to-image-node.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(CreateTextToImageNodeController);
