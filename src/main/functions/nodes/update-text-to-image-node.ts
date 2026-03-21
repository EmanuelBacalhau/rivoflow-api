import 'reflect-metadata';
import { UpdateTextToImageNodeController } from '@application/controllers/nodes/update-text-to-image-node.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(UpdateTextToImageNodeController);
