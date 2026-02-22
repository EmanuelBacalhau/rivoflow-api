import 'reflect-metadata';
import { CalculateCreditsNodeGeneratorController } from '@application/controllers/nodes/calculate-credits-node-generator.controller';
import { lambdaHttpAdapter } from '@main/adapters/lambda-http-adapter';

export const handler = lambdaHttpAdapter(CalculateCreditsNodeGeneratorController);
