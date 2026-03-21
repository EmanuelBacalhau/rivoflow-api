import { UpscaleModelEnum } from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { fal } from '@fal-ai/client';
import { Injectable } from 'src/kernel/decorators/injectable';
import { FileStorageGateway } from '../aws/file-storage.gateway';
import { FalPricingGateway } from './fal-pricing.gateway';

@Injectable()
export class UpscaleGatewayAI {
  constructor(
    private readonly fileStorageGateway: FileStorageGateway,
    private readonly falPricingGateway: FalPricingGateway,
  ) {}

  async process(params: UpscaleGatewayAI.Input): Promise<UpscaleGatewayAI.Output> {
    const imageUrl = this.fileStorageGateway.generateCdnUrl(params.imageKey);

    let result: UpscaleGatewayAI.FalResponse;

    try {
      const response = await fal.subscribe(UpscaleGatewayAI.Model, {
        input: {
          image_url: imageUrl,
          scale: params.scale,
          face: params.face,
          model: params.upscaleModel,
          output_format: 'png',
        },
      });

      result = response.data as UpscaleGatewayAI.FalResponse;
    } catch (error: any) {
      const body = error?.body ?? error?.message ?? 'Unknown AI error';
      const detail = typeof body === 'object' ? JSON.stringify(body) : String(body);
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Upscale failed: ${detail}`);
    }

    if (!result.image?.url) {
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'No image returned from upscale');
    }

    const imageBuffer = await this.downloadImage(result.image.url);

    const key = await this.fileStorageGateway.uploadFile({
      buffer: imageBuffer,
      extension: 'png',
      contentType: 'image/png',
      accountId: params.accountId,
      flowId: params.flowId,
    });

    const costUsd = await this.falPricingGateway.getUnitPrice(UpscaleGatewayAI.Model);

    return { key, costUsd };
  }

  private async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Failed to download upscaled image: ${message}`);
    }
  }
}

export namespace UpscaleGatewayAI {
  export type Input = {
    imageKey: string;
    scale: number;
    face: boolean;
    upscaleModel: UpscaleModelEnum;
    accountId: string;
    flowId: string;
  };

  export type Output = {
    key: string;
    costUsd: number;
  };

  export type FalResponse = {
    image: { url: string; width: number; height: number; content_type: string };
  };

  export const Model = 'fal-ai/esrgan';
}
