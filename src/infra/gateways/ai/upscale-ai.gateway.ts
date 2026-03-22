import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { fal } from '@fal-ai/client';
import { Injectable } from 'src/kernel/decorators/injectable';
import { FileStorageGateway } from '../aws/file-storage.gateway';
import { FalFileResolver } from './fal-file-resolver';
import { FalPricingGateway } from './fal-pricing.gateway';

@Injectable()
export class UpscaleGatewayAI {
  constructor(
    private readonly fileStorageGateway: FileStorageGateway,
    private readonly falFileResolver: FalFileResolver,
    private readonly falPricingGateway: FalPricingGateway,
  ) {}

  async submit(params: UpscaleGatewayAI.Input, webhookUrl: string): Promise<{ requestId: string }> {
    const imageUrl = await this.falFileResolver.resolve(params.imageKey);

    try {
      const { request_id } = await fal.queue.submit(UpscaleGatewayAI.Model, {
        input: {
          image_url: imageUrl,
          upscale_factor: params.scale,
          output_format: 'png',
        },
        webhookUrl,
      });

      return { requestId: request_id };
    } catch (error: any) {
      const body = error?.body ?? error?.message ?? 'Unknown AI error';
      const detail = typeof body === 'object' ? JSON.stringify(body) : String(body);
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Upscale submit failed: ${detail}`);
    }
  }

  async completeFromWebhook(
    payload: UpscaleGatewayAI.FalResponse,
    accountId: string,
    flowId: string,
  ): Promise<UpscaleGatewayAI.Output> {
    if (!payload.image?.url) {
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'No image returned from upscale');
    }

    const imageBuffer = await this.downloadFile(payload.image.url);

    const key = await this.fileStorageGateway.uploadFile({
      buffer: imageBuffer,
      extension: 'png',
      contentType: 'image/png',
      accountId,
      flowId,
    });

    const costUsd = await this.falPricingGateway.getUnitPrice(UpscaleGatewayAI.Model);

    return { key, costUsd };
  }

  private async downloadFile(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Failed to download file: ${message}`);
    }
  }
}

export namespace UpscaleGatewayAI {
  export type Input = {
    imageKey: string;
    scale: number;
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

  export const Model = 'fal-ai/seedvr/upscale/image';
}
