import 'reflect-metadata';
import { GetNodeMetadataController } from '@application/controllers/nodes/get-node-metadata.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(GetNodeMetadataController);
