import 'reflect-metadata';
import { CreateMotionControlNodeController } from '@application/controllers/nodes/create-motion-control-node.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(CreateMotionControlNodeController);
