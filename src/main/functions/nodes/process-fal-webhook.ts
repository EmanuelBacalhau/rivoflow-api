import 'reflect-metadata';
import { FalWebhookQueueConsumer } from '@application/queues/fal-webhook-queue.consumer';
import { lambdaSQSAdapter } from '@main/adapters/lambda-sqs-adapter';

export const handler = lambdaSQSAdapter(FalWebhookQueueConsumer);
