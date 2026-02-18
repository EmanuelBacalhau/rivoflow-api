import 'reflect-metadata';

import { CreateFlowController } from '@application/controllers/flows/create-flow.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(CreateFlowController);
