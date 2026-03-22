import 'reflect-metadata';
import { FalWebhookController } from '@application/controllers/nodes/fal-webhook.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(FalWebhookController);
