import 'reflect-metadata';
import { CreateUpscaleNodeController } from '@application/controllers/nodes/create-upscale-node.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(CreateUpscaleNodeController);
