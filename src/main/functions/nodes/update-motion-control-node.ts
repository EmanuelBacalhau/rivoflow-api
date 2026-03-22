import 'reflect-metadata';
import { UpdateMotionControlNodeController } from '@application/controllers/nodes/update-motion-control-node.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(UpdateMotionControlNodeController);
