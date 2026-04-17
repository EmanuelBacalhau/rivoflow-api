import 'reflect-metadata';
import { ProcessPaymentUseCase } from '@application/use-cases/payments/process-payment.use-case';
import { PaymentLambdaGateway } from '@infra/gateways/aws/payment-lambda.gateway';
import { Registry } from 'src/kernel/di/registry';

export const handler = async (event: PaymentLambdaGateway.PublishParams): Promise<void> => {
  const useCase = Registry.resolve(ProcessPaymentUseCase);
  await useCase.execute(event.webhookData);
};
