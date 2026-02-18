import 'reflect-metadata';

import { ExchangeCodeController } from '@application/controllers/auth/exchange-code.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(ExchangeCodeController);
