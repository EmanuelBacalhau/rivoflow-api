export interface IQueueConsumer<T extends Record<string, unknown>> {
  consume(message: T): Promise<void>;
}
