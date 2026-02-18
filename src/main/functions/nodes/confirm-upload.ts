import 'reflect-metadata';
import { ConfirmUploadController } from '@application/controllers/nodes/confirm-upload.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(ConfirmUploadController);
