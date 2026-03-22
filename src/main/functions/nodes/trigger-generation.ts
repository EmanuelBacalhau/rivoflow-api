import 'reflect-metadata';
import { TriggerGenerationController } from '@application/controllers/nodes/trigger-generation.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(TriggerGenerationController);
