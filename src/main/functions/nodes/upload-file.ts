import 'reflect-metadata';
import { UploadFileController } from '@application/controllers/nodes/upload-file.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(UploadFileController);
