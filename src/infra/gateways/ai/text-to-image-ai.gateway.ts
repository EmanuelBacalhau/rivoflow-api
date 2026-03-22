import { AspectRatioEnum, QualityEnum } from '@application/entities/node-enums';
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

  async submit(params: TextToImageGatewayAI.Input, webhookUrl: string): Promise<{ requestId: string }> {
    try {
      const { request_id } = await fal.queue.submit(TextToImageGatewayAI.Model, {
        input: {
          prompt: params.prompt,
          aspect_ratio: params.aspectRatio,
          resolution: params.quality,
          output_format: 'png',
          num_images: 1,
        },
        webhookUrl,
      });

      return { requestId: request_id };
    } catch (error: any) {
      const body = error?.body ?? error?.message ?? 'Unknown AI error';
      const detail = typeof body === 'object' ? JSON.stringify(body) : String(body);
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Text-to-image submit failed: ${detail}`);
    }
  }

  async completeFromWebhook(
    payload: TextToImageGatewayAI.FalResponse,
    accountId: string,
    flowId: string,
    quality: QualityEnum,
  ): Promise<TextToImageGatewayAI.Output> {
    if (!payload.images || payload.images.length === 0) {
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'No images returned from AI');
    }

    const imageBuffer = await this.downloadFile(payload.images[0].url);

    const key = await this.fileStorageGateway.uploadFile({
      buffer: imageBuffer,
      extension: 'png',
      contentType: 'image/png',
      accountId,
      flowId,
    });

    const costUsd = await this.falPricingGateway.getCostForQuality(TextToImageGatewayAI.Model, quality);

    return { key, costUsd };
  }

  private async downloadFile(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Failed to download file: HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }
}

export namespace TextToImageGatewayAI {
  export type Input = {
    prompt: string;
    aspectRatio: AspectRatioEnum;
    quality: QualityEnum;
    accountId: string;
    flowId: string;
  };

  export type Output = {
    key: string;
    costUsd: number;
  };

  export type FalResponse = {
    images: { url: string; width: number; height: number; content_type: string }[];
  };

  export const Model = 'fal-ai/nano-banana-2';
}
