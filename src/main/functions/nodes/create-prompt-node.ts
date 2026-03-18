import 'reflect-metadata';
import { CreatePromptNodeController } from '@application/controllers/nodes/create-prompt-node.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(CreatePromptNodeController);
