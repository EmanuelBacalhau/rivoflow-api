import 'reflect-metadata';
import { PaymentQueueConsumer } from '@application/queues/payment-queue.consumer';
import { lambdaSQSAdapter } from '@main/adapters/lambda-sqs-adapter';

export const handler = lambdaSQSAdapter(PaymentQueueConsumer);
