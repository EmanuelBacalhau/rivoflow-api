import 'reflect-metadata';
import { DeleteEdgeController } from '@application/controllers/edges/delete-edge.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(DeleteEdgeController);
