import 'reflect-metadata';
import { ImageQueueConsumer } from '@application/queues/image-queue.consumer';
import { lambdaSQSAdapter } from '@main/adapters/lambda-sqs-adapter';

export const handler = lambdaSQSAdapter(ImageQueueConsumer);
