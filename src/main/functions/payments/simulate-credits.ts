import 'reflect-metadata';
import { SimulateCreditsController } from '@application/controllers/payments/simulate-credits.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(SimulateCreditsController);
