import { IQueueConsumer } from '@application/contracts/interfaces/i-queue-consumer';
import { ProcessImageAIUseCase } from '@application/use-cases/nodes/process-image-ai.use-case';
import { ImageSQSGateway } from '@infra/gateways/aws/image-sqs.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

@Injectable()
export class ImageQueueConsumer implements IQueueConsumer<ImageSQSGateway.PublishParams> {
  constructor(private readonly processImageAIUseCase: ProcessImageAIUseCase) {}

  async consume(message: ImageSQSGateway.PublishParams): Promise<void> {
    await this.processImageAIUseCase.execute(message);
  }
}
