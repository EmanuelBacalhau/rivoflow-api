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
    fal.config({ credentials: this.appConfig.ai.falKey });
  }

  async processImage(
    params: ImageGatewayAI.ProcessImageInput,
  ): Promise<ImageGatewayAI.ProcessImageOutput> {
    const imageUrls = await this.prepareImageUrls(params);

    if (!params.prompt || params.prompt.length < 3) {
      throw new ApplicationError(ErrorCode.VALIDATION_ERROR, 'Prompt must be at least 3 characters');
    }

    if (imageUrls.length === 0) {
      throw new ApplicationError(ErrorCode.VALIDATION_ERROR, 'At least one image is required for editing');
    }

    let result: ImageGatewayAI.FalResponse;

    try {
      const response = await fal.subscribe(ImageGatewayAI.Model, {
        input: {
          prompt: params.prompt,
          image_urls: imageUrls,
          aspect_ratio: params.parameters.aspectRatio,
          resolution: params.parameters.quality,
          output_format: 'png' as const,
          num_images: 1,
        },
      });

      result = response.data as ImageGatewayAI.FalResponse;
    } catch (error: any) {
      const body = error?.body ?? error?.message ?? 'Unknown AI error';
      const detail = typeof body === 'object' ? JSON.stringify(body) : String(body);
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, `AI image generation failed: ${detail}`);
    }

    if (!result.images || result.images.length === 0) {
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'No images returned from AI');
    }

    const imageUrl = result.images[0].url;
    const imageBuffer = await this.downloadImage(imageUrl);

    const key = await this.fileStorageGateway.uploadFile({
      buffer: imageBuffer,
      extension: 'png',
      contentType: 'image/png',
      accountId: params.accountId,
      flowId: params.flowId,
    });

    const costUsd = await this.falPricingGateway.getCostForQuality(
      ImageGatewayAI.Model,
      params.parameters.quality,
    );

    return { key, costUsd };
  }

  private async prepareImageUrls(params: ImageGatewayAI.ProcessImageInput): Promise<string[]> {
    if (params.images.length === 0) return [];

    return Promise.all(params.images.map(({ key }) => this.falFileResolver.resolve(key)));
  }

  private async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Failed to download generated image: ${message}`);
    }
  }
}

export namespace ImageGatewayAI {
  export type ProcessImageInput = {
    images: {
      key: string;
    }[];
    prompt: string;
    parameters: { aspectRatio: AspectRatioEnum; quality: QualityEnum };
    accountId: string;
    flowId: string;
  };

  export type ProcessImageOutput = {
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
