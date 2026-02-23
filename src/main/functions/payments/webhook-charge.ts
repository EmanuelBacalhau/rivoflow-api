import 'reflect-metadata';
import { WebhookChargeController } from '@application/controllers/payments/webhook-charge.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(WebhookChargeController);
