import 'reflect-metadata';

import { SignOutController } from '@application/controllers/auth/sign-out.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(SignOutController);
