import 'reflect-metadata';
import { UpdateUpscaleNodeController } from '@application/controllers/nodes/update-upscale-node.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(UpdateUpscaleNodeController);
