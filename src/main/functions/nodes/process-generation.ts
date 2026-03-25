import 'reflect-metadata';
import { GenerationQueueConsumer } from '@application/queues/generation-queue.consumer';
import { lambdaSQSAdapter } from '@main/adapters/lambda-sqs-adapter';

export const handler = lambdaSQSAdapter(GenerationQueueConsumer);
