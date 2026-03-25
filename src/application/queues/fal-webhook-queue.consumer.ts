import { IQueueConsumer } from '@application/contracts/interfaces/i-queue-consumer';
import { FalWebhookUseCase } from '@application/use-cases/nodes/fal-webhook.use-case';
import { FalWebhookSQSGateway } from '@infra/gateways/aws/fal-webhook-sqs.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

@Injectable()
export class FalWebhookQueueConsumer implements IQueueConsumer<FalWebhookSQSGateway.PublishParams> {
  constructor(private readonly falWebhookUseCase: FalWebhookUseCase) {}

  async consume(message: FalWebhookSQSGateway.PublishParams): Promise<void> {
    await this.falWebhookUseCase.execute(message);
  }
}
