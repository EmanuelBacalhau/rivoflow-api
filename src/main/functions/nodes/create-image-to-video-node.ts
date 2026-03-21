import 'reflect-metadata';
import { CreateImageToVideoNodeController } from '@application/controllers/nodes/create-image-to-video-node.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(CreateImageToVideoNodeController);
