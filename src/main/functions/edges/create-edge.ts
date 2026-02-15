import 'reflect-metadata';
import { CreateEdgeController } from '@application/controllers/edges/create-edge.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(CreateEdgeController);
