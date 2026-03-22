import { IQueueConsumer } from '@application/contracts/interfaces/i-queue-consumer';
import { ProcessImageAIUseCase } from '@application/use-cases/nodes/process-image-ai.use-case';
import { ProcessImageToVideoUseCase } from '@application/use-cases/nodes/process-image-to-video.use-case';
import { ProcessMotionControlUseCase } from '@application/use-cases/nodes/process-motion-control.use-case';
import { ProcessRemoveBgUseCase } from '@application/use-cases/nodes/process-remove-bg.use-case';
import { ProcessTextToImageUseCase } from '@application/use-cases/nodes/process-text-to-image.use-case';
import { ProcessUpscaleUseCase } from '@application/use-cases/nodes/process-upscale.use-case';
import { ImageSQSGateway } from '@infra/gateways/aws/image-sqs.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

@Injectable()
export class ImageQueueConsumer implements IQueueConsumer<ImageSQSGateway.PublishParams> {
  constructor(
    private readonly processImageAIUseCase: ProcessImageAIUseCase,
    private readonly processTextToImageUseCase: ProcessTextToImageUseCase,
    private readonly processUpscaleUseCase: ProcessUpscaleUseCase,
    private readonly processRemoveBgUseCase: ProcessRemoveBgUseCase,
    private readonly processImageToVideoUseCase: ProcessImageToVideoUseCase,
    private readonly processMotionControlUseCase: ProcessMotionControlUseCase,
  ) {}

  async consume(message: ImageSQSGateway.PublishParams): Promise<void> {
    switch (message.modelType) {
      case 'text-to-image':
        return this.processTextToImageUseCase.execute(message);
      case 'upscale':
        return this.processUpscaleUseCase.execute(message);
      case 'remove-bg':
        return this.processRemoveBgUseCase.execute(message);
      case 'image-to-video':
        return this.processImageToVideoUseCase.execute(message);
      case 'motion-control':
        return this.processMotionControlUseCase.execute(message);
      case 'image-edit':
      default:
        return this.processImageAIUseCase.execute(message);
    }
  }
}
