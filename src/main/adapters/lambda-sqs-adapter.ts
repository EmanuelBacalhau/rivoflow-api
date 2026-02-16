import { IQueueConsumer } from '@application/contracts/interfaces/i-queue-consumer';
import { SQSHandler } from 'aws-lambda';
import { Registry } from 'src/kernel/di/registry';

export function lambdaSQSAdapter(
  implementation: Registry.Constructor<IQueueConsumer<any>>,
): SQSHandler {
  return async (event) => {
    const consumer = Registry.resolve(implementation);

    await Promise.all(
      event.Records.map((record) => {
        const message = JSON.parse(record.body);
        return consumer.consume(message);
      }),
    );
  };
}
