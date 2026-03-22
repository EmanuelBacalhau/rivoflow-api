import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { fal } from '@fal-ai/client';
import { Injectable } from 'src/kernel/decorators/injectable';
import { FileStorageGateway } from '../aws/file-storage.gateway';
import { FalFileResolver } from './fal-file-resolver';
import { FalPricingGateway } from './fal-pricing.gateway';

@Injectable()
export class RemoveBgGatewayAI {
  constructor(
    private readonly fileStorageGateway: FileStorageGateway,
    private readonly falFileResolver: FalFileResolver,
    private readonly falPricingGateway: FalPricingGateway,
  ) {}

  async submit(params: RemoveBgGatewayAI.Input, webhookUrl: string): Promise<{ requestId: string }> {
    const imageUrl = await this.falFileResolver.resolve(params.imageKey);

    try {
      const { request_id } = await fal.queue.submit(RemoveBgGatewayAI.Model, {
        input: {
          image_url: imageUrl,
          model: 'General Use (Light)',
          operating_resolution: '1024x1024',
          output_format: 'png',
        },
        webhookUrl,
      });

      return { requestId: request_id };
    } catch (error: any) {
      const body = error?.body ?? error?.message ?? 'Unknown AI error';
      const detail = typeof body === 'object' ? JSON.stringify(body) : String(body);
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Remove BG submit failed: ${detail}`);
    }
  }

  async completeFromWebhook(
    payload: RemoveBgGatewayAI.FalResponse,
    accountId: string,
    flowId: string,
  ): Promise<RemoveBgGatewayAI.Output> {
    if (!payload.image?.url) {
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'No image returned from background removal');
    }

    const imageBuffer = await this.downloadFile(payload.image.url);

    const key = await this.fileStorageGateway.uploadFile({
      buffer: imageBuffer,
      extension: 'png',
      contentType: 'image/png',
      accountId,
      flowId,
    });

    const costUsd = await this.falPricingGateway.getUnitPrice(RemoveBgGatewayAI.Model);

    return { key, costUsd };
  }

  private async downloadFile(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Failed to download file: HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }
}

export namespace RemoveBgGatewayAI {
  export type Input = {
    imageKey: string;
    accountId: string;
    flowId: string;
  };

  export type Output = {
    key: string;
    costUsd: number;
  };

  export type FalResponse = {
    image: { url: string; width: number; height: number };
  };

  export const Model = 'fal-ai/birefnet';
}
