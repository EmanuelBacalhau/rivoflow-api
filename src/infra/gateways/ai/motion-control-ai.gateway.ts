import { CharacterOrientationEnum } from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { fal } from '@fal-ai/client';
import { Injectable } from 'src/kernel/decorators/injectable';
import { FileStorageGateway } from '../aws/file-storage.gateway';
import { FalFileResolver } from './fal-file-resolver';
import { FalPricingGateway } from './fal-pricing.gateway';

@Injectable()
export class MotionControlGatewayAI {
  constructor(
    private readonly fileStorageGateway: FileStorageGateway,
    private readonly falFileResolver: FalFileResolver,
    private readonly falPricingGateway: FalPricingGateway,
  ) {}

  async submit(
    params: MotionControlGatewayAI.Input,
    webhookUrl: string,
  ): Promise<{
    requestId: string;
  }> {
    const imageUrl = await this.falFileResolver.resolve(params.imageKey);
    const videoUrl = await this.falFileResolver.resolve(params.videoKey);

    try {
      const { request_id } = await fal.queue.submit(MotionControlGatewayAI.Model, {
        input: {
          image_url: imageUrl,
          video_url: videoUrl,
          character_orientation: params.characterOrientation,
          keep_original_sound: params.keepOriginalSound,
          prompt: params.prompt || undefined,
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
        `Motion control submit failed: ${detail}`,
      );
    }
  }

  async completeFromWebhook(
    payload: MotionControlGatewayAI.FalResponse,
    accountId: string,
    flowId: string,
  ): Promise<MotionControlGatewayAI.Output> {
    if (!payload.video?.url) {
      throw new ApplicationError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        'No video returned from motion control',
      );
    }

    const videoBuffer = await this.downloadFile(payload.video.url);

    const key = await this.fileStorageGateway.uploadFile({
      buffer: videoBuffer,
      extension: 'mp4',
      contentType: 'video/mp4',
      accountId,
      flowId,
    });

    const costUsd = await this.falPricingGateway.getUnitPrice(MotionControlGatewayAI.Model);

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

export namespace MotionControlGatewayAI {
  export type Input = {
    imageKey: string;
    videoKey: string;
    characterOrientation: CharacterOrientationEnum;
    keepOriginalSound: boolean;
    prompt: string;
    accountId: string;
    flowId: string;
  };

  export type Output = {
    key: string;
    costUsd: number;
  };

  export type FalResponse = {
    video: {
      url: string;
    };
  };

  export const Model = 'fal-ai/kling-video/v3/pro/motion-control';
}
