import { AspectRatioEnum, QualityEnum } from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { fal } from '@fal-ai/client';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';
import { FileStorageGateway } from '../aws/file-storage.gateway';
import { FalFileResolver } from './fal-file-resolver';
import { FalPricingGateway } from './fal-pricing.gateway';

@Injectable()
export class ImageGatewayAI {
  constructor(
    private readonly fileStorageGateway: FileStorageGateway,
    private readonly falFileResolver: FalFileResolver,
    private readonly appConfig: AppConfig,
    private readonly falPricingGateway: FalPricingGateway,
  ) {
    fal.config({
      credentials: this.appConfig.ai.falKey,
    });
  }

  async submit(
    params: ImageGatewayAI.SubmitInput,
    webhookUrl: string,
  ): Promise<{
    requestId: string;
  }> {
    const imageUrls = await Promise.all(
      params.images.map(({ key }) => this.falFileResolver.resolve(key)),
    );

    try {
      const { request_id } = await fal.queue.submit(ImageGatewayAI.Model, {
        input: {
          prompt: params.prompt,
          image_urls: imageUrls,
          aspect_ratio: params.parameters.aspectRatio,
          resolution: params.parameters.quality,
          output_format: 'png',
          num_images: 1,
        },
        webhookUrl,
      });

      return {
        requestId: request_id,
      };
    } catch (error: any) {
      const body = error?.body ?? error?.message ?? 'Unknown AI error';
      const detail = typeof body === 'object' ? JSON.stringify(body) : String(body);
      throw new ApplicationError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `Image edit submit failed: ${detail}`,
      );
    }
  }

  async completeFromWebhook(
    payload: ImageGatewayAI.FalResponse,
    accountId: string,
    flowId: string,
    quality: QualityEnum,
  ): Promise<ImageGatewayAI.Output> {
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

    const costUsd = await this.falPricingGateway.getCostForQuality(ImageGatewayAI.Model, quality);

    return {
      key,
      costUsd,
    };
  }

  private async downloadFile(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok)
      throw new ApplicationError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `Failed to download file: HTTP ${response.status}`,
      );
    return Buffer.from(await response.arrayBuffer());
  }
}

export namespace ImageGatewayAI {
  export type SubmitInput = {
    images: {
      key: string;
    }[];
    prompt: string;
    parameters: {
      aspectRatio: AspectRatioEnum;
      quality: QualityEnum;
    };
    accountId: string;
    flowId: string;
  };

  export type Output = {
    key: string;
    costUsd: number;
  };

  export type FalImage = {
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
    width: number;
    height: number;
  };

  export type FalResponse = {
    images: FalImage[];
    description?: string;
  };

  export const Model = 'fal-ai/nano-banana-2/edit';
}
