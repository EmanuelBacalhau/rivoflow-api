import { VideoTierEnum } from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { fal } from '@fal-ai/client';
import { Injectable } from 'src/kernel/decorators/injectable';
import { FileStorageGateway } from '../aws/file-storage.gateway';
import { FalPricingGateway } from './fal-pricing.gateway';

const MODEL_BY_TIER: Record<VideoTierEnum, string> = {
  [VideoTierEnum.STANDARD]: 'fal-ai/ltx-2.3/image-to-video',
  [VideoTierEnum.PREMIUM]: 'fal-ai/kling-video/v3/pro/image-to-video',
};

@Injectable()
export class ImageToVideoGatewayAI {
  constructor(
    private readonly fileStorageGateway: FileStorageGateway,
    private readonly falPricingGateway: FalPricingGateway,
  ) {}

  async process(params: ImageToVideoGatewayAI.Input): Promise<ImageToVideoGatewayAI.Output> {
    const imageUrl = this.fileStorageGateway.generateCdnUrl(params.imageKey);
    const model = MODEL_BY_TIER[params.tier];

    let result: ImageToVideoGatewayAI.FalResponse;

    try {
      const input = params.tier === VideoTierEnum.STANDARD
        ? this.buildLtxInput(imageUrl, params)
        : this.buildKlingInput(imageUrl, params);

      const response = await fal.subscribe(model, { input });
      result = response.data as ImageToVideoGatewayAI.FalResponse;
    } catch (error: any) {
      const body = error?.body ?? error?.message ?? 'Unknown AI error';
      const detail = typeof body === 'object' ? JSON.stringify(body) : String(body);
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Video generation failed: ${detail}`);
    }

    if (!result.video?.url) {
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'No video returned from AI');
    }

    const videoBuffer = await this.downloadFile(result.video.url);

    const key = await this.fileStorageGateway.uploadFile({
      buffer: videoBuffer,
      extension: 'mp4',
      contentType: 'video/mp4',
      accountId: params.accountId,
      flowId: params.flowId,
    });

    const durationSeconds = Number(params.duration);
    const unitPrice = await this.falPricingGateway.getUnitPrice(model);
    const costUsd = unitPrice * durationSeconds;

    return {
      key,
      costUsd,
      duration: result.video.duration ?? durationSeconds,
      fps: result.video.fps ?? 25,
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

  private buildKlingInput(imageUrl: string, params: ImageToVideoGatewayAI.Input) {
    return {
      start_image_url: imageUrl,
      prompt: params.prompt || 'animate this image with cinematic motion',
      duration: params.duration,
      generate_audio: params.generateAudio,
    };
  }

  private async downloadFile(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Failed to download video: ${message}`);
    }
  }
}

export namespace ImageToVideoGatewayAI {
  export type Input = {
    imageKey: string;
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
