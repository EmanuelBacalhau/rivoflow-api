import 'reflect-metadata';

import { RefreshTokenController } from '@application/controllers/auth/refresh-token.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(RefreshTokenController);
