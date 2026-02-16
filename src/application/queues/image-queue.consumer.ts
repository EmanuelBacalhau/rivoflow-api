import { IQueueConsumer } from '@application/contracts/interfaces/i-queue-consumer';
import { ProcessImageAIUseCase } from '@application/use-cases/node/process-image-ai.use-case';
import { ImageSQSGateway } from '@infra/gateways/aws/ImageSQSGateway';
import { Injectable } from 'src/kernel/decorators/injectable';

@Injectable()
export class ImageQueueConsumer implements IQueueConsumer<ImageSQSGateway.Message> {
  constructor(private readonly processImageAIUseCase: ProcessImageAIUseCase) {}

  async consume(message: ImageSQSGateway.Message): Promise<void> {
    await this.processImageAIUseCase.execute(message);
  }
}
