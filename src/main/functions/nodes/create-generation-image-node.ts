import 'reflect-metadata';
import { CreateGenerationImageNodeController } from '@application/controllers/nodes/create-generation-image-node.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(CreateGenerationImageNodeController);
