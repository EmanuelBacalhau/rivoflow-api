import 'reflect-metadata';
import { UpdateGenerationNodeController } from '@application/controllers/nodes/update-generation-node.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(UpdateGenerationNodeController);
