import 'reflect-metadata';

import { UpdateFlowController } from '@application/controllers/flows/update-flow.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(UpdateFlowController);
