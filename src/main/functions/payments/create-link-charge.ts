import 'reflect-metadata';
import { CreateLinkChargeController } from '@application/controllers/payments/create-link-charge.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(CreateLinkChargeController);
