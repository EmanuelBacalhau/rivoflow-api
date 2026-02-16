import 'reflect-metadata';
import { CreateImageAIController } from '@application/controllers/nodes/create-image-ai.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(CreateImageAIController);
