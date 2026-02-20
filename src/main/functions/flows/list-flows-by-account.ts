import 'reflect-metadata';

import { ListFlowsByAccountController } from '@application/controllers/flows/list-flows-by-account.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(ListFlowsByAccountController);
