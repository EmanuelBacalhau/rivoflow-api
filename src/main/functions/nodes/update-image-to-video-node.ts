import 'reflect-metadata';
import { UpdateImageToVideoNodeController } from '@application/controllers/nodes/update-image-to-video-node.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(UpdateImageToVideoNodeController);
