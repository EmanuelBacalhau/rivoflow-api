import { IQueueConsumer } from '@application/contracts/interfaces/i-queue-consumer';
import { ProcessPaymentUseCase } from '@application/use-cases/payments/process-payment.use-case';
import { PaymentSQSGateway } from '@infra/gateways/aws/payment-sqs.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

@Injectable()
export class PaymentQueueConsumer implements IQueueConsumer<PaymentSQSGateway.PublishParams> {
  constructor(private readonly processPaymentUseCase: ProcessPaymentUseCase) {}

  async consume(message: PaymentSQSGateway.PublishParams): Promise<void> {
    await this.processPaymentUseCase.execute(message.webhookData);
  }
}
