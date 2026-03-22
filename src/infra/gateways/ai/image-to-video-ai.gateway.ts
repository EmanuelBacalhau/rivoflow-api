import { VideoTierEnum } from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { fal } from '@fal-ai/client';
import { Injectable } from 'src/kernel/decorators/injectable';
import { FileStorageGateway } from '../aws/file-storage.gateway';
import { FalFileResolver } from './fal-file-resolver';
import { FalPricingGateway } from './fal-pricing.gateway';

const MODEL_BY_TIER: Record<VideoTierEnum, string> = {
  [VideoTierEnum.STANDARD]: 'fal-ai/ltx-2.3/image-to-video',
  [VideoTierEnum.PREMIUM]: 'fal-ai/kling-video/v3/pro/image-to-video',
};

@Injectable()
export class ImageToVideoGatewayAI {
  constructor(
    private readonly fileStorageGateway: FileStorageGateway,
    private readonly falFileResolver: FalFileResolver,
    private readonly falPricingGateway: FalPricingGateway,
  ) {}

  async submit(params: ImageToVideoGatewayAI.Input, webhookUrl: string): Promise<{ requestId: string }> {
    const imageUrl = await this.falFileResolver.resolve(params.imageKey);
    const model = MODEL_BY_TIER[params.tier];

    try {
      const input = params.tier === VideoTierEnum.STANDARD
        ? this.buildLtxInput(imageUrl, params)
        : await this.buildKlingInput(imageUrl, params);

      const { request_id } = await fal.queue.submit(model, { input, webhookUrl });

      return { requestId: request_id };
    } catch (error: any) {
      const body = error?.body ?? error?.message ?? 'Unknown AI error';
      const detail = typeof body === 'object' ? JSON.stringify(body) : String(body);
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Video submit failed: ${detail}`);
    }
  }

  async completeFromWebhook(
    payload: ImageToVideoGatewayAI.FalResponse,
    accountId: string,
    flowId: string,
    tier: VideoTierEnum,
    duration: string,
  ): Promise<ImageToVideoGatewayAI.Output> {
    if (!payload.video?.url) {
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'No video returned from AI');
    }

    const videoBuffer = await this.downloadFile(payload.video.url);

    const key = await this.fileStorageGateway.uploadFile({
      buffer: videoBuffer,
      extension: 'mp4',
      contentType: 'video/mp4',
      accountId,
      flowId,
    });

    const model = MODEL_BY_TIER[tier];
    const durationSeconds = Number(duration);
    const unitPrice = await this.falPricingGateway.getUnitPrice(model);
    const costUsd = unitPrice * durationSeconds;

    return {
      key,
      costUsd,
      duration: payload.video.duration ?? durationSeconds,
      fps: payload.video.fps ?? 25,
    };
  }

  private buildLtxInput(imageUrl: string, params: ImageToVideoGatewayAI.Input) {
    return {
      image_url: imageUrl,
      prompt: params.prompt || 'animate this image',
      duration: Number(params.duration),
      resolution: params.resolution,
      aspect_ratio: params.aspectRatio,
      generate_audio: params.generateAudio,
    };
  }

  private async buildKlingInput(imageUrl: string, params: ImageToVideoGatewayAI.Input) {
    const input: Record<string, unknown> = {
      start_image_url: imageUrl,
      prompt: params.prompt || 'animate this image with cinematic motion',
      duration: params.duration,
      generate_audio: params.generateAudio,
    };

    if (params.endImageKey) {
      input.end_image_url = await this.falFileResolver.resolve(params.endImageKey);
    }

    return input;
  }

  private async downloadFile(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Failed to download file: HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }
}

export namespace ImageToVideoGatewayAI {
  export type Input = {
    imageKey: string;
    endImageKey?: string;
    prompt: string;
    tier: VideoTierEnum;
    duration: string;
    resolution: string;
    aspectRatio: string;
    generateAudio: boolean;
    accountId: string;
    flowId: string;
  };

  export type Output = {
    key: string;
    costUsd: number;
    duration: number;
    fps: number;
  };

  export type FalResponse = {
    video: {
      url: string;
      file_name?: string;
      content_type?: string;
      file_size?: number;
      width?: number;
      height?: number;
      fps?: number;
      duration?: number;
    };
  };
}
