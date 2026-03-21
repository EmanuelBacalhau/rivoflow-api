import 'reflect-metadata';
import { UpdateNodePositionController } from '@application/controllers/nodes/update-node-position.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(UpdateNodePositionController);
