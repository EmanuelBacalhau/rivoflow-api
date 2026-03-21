import { ImageSizeEnum } from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { fal } from '@fal-ai/client';
import { Injectable } from 'src/kernel/decorators/injectable';
import { FileStorageGateway } from '../aws/file-storage.gateway';
import { FalPricingGateway } from './fal-pricing.gateway';

@Injectable()
export class TextToImageGatewayAI {
  constructor(
    private readonly fileStorageGateway: FileStorageGateway,
    private readonly falPricingGateway: FalPricingGateway,
  ) {}

  async process(
    params: TextToImageGatewayAI.Input,
  ): Promise<TextToImageGatewayAI.Output> {
    if (!params.prompt || params.prompt.length < 3) {
      throw new ApplicationError(ErrorCode.VALIDATION_ERROR, 'Prompt must be at least 3 characters');
    }

    let result: TextToImageGatewayAI.FalResponse;

    try {
      const response = await fal.subscribe(TextToImageGatewayAI.Model, {
        input: {
          prompt: params.prompt,
          image_size: params.imageSize,
          guidance_scale: params.guidanceScale,
          seed: params.seed ?? undefined,
          num_images: 1,
          output_format: 'png',
        },
      });

      result = response.data as TextToImageGatewayAI.FalResponse;
    } catch (error: any) {
      const body = error?.body ?? error?.message ?? 'Unknown AI error';
      const detail = typeof body === 'object' ? JSON.stringify(body) : String(body);
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Text-to-image generation failed: ${detail}`);
    }

    if (!result.images || result.images.length === 0) {
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'No images returned from AI');
    }

    const image = result.images[0];
    const imageBuffer = await this.downloadImage(image.url);

    const key = await this.fileStorageGateway.uploadFile({
      buffer: imageBuffer,
      extension: 'png',
      contentType: 'image/png',
      accountId: params.accountId,
      flowId: params.flowId,
    });

    const costUsd = await this.falPricingGateway.getUnitPrice(TextToImageGatewayAI.Model);

    return { key, costUsd, seed: result.seed };
  }

  private async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Failed to download generated image: ${message}`);
    }
  }
}

export namespace TextToImageGatewayAI {
  export type Input = {
    prompt: string;
    imageSize: ImageSizeEnum;
    guidanceScale: number;
    seed: number | null;
    accountId: string;
    flowId: string;
  };

  export type Output = {
    key: string;
    costUsd: number;
    seed: number;
  };

  export type FalResponse = {
    images: { url: string; width: number; height: number; content_type: string }[];
    seed: number;
  };

  export const Model = 'fal-ai/flux/dev';
}
