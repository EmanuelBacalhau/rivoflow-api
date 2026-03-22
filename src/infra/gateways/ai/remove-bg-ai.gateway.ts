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

  async process(params: RemoveBgGatewayAI.Input): Promise<RemoveBgGatewayAI.Output> {
    const imageUrl = await this.falFileResolver.resolve(params.imageKey);

    let result: RemoveBgGatewayAI.FalResponse;

    try {
      const response = await fal.subscribe(RemoveBgGatewayAI.Model, {
        input: {
          image_url: imageUrl,
          model: 'General Use (Light)',
          operating_resolution: '1024x1024',
          output_format: 'png',
        },
      });

      result = response.data as RemoveBgGatewayAI.FalResponse;
    } catch (error: any) {
      const body = error?.body ?? error?.message ?? 'Unknown AI error';
      const detail = typeof body === 'object' ? JSON.stringify(body) : String(body);
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Background removal failed: ${detail}`);
    }

    if (!result.image?.url) {
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'No image returned from background removal');
    }

    const imageBuffer = await this.downloadImage(result.image.url);

    const key = await this.fileStorageGateway.uploadFile({
      buffer: imageBuffer,
      extension: 'png',
      contentType: 'image/png',
      accountId: params.accountId,
      flowId: params.flowId,
    });

    const costUsd = await this.falPricingGateway.getUnitPrice(RemoveBgGatewayAI.Model);

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
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Failed to download image: ${message}`);
    }
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
