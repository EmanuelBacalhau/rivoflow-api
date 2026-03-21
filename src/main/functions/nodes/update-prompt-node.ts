import 'reflect-metadata';
import { UpdatePromptNodeController } from '@application/controllers/nodes/update-prompt-node.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(UpdatePromptNodeController);
