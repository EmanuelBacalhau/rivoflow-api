import { NodeEntity } from '@application/entities/node.entity';
import { QualityEnum, VideoResolutionEnum, VideoTierEnum } from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { AccountBalanceDrizzleRepository } from '@infra/database/drizzle/repositories/account-balance-drizzle.repository';
import { FalPricingGateway } from '@infra/gateways/ai/fal-pricing.gateway';
import { ImageGatewayAI } from '@infra/gateways/ai/image-ai.gateway';
import { RemoveBgGatewayAI } from '@infra/gateways/ai/remove-bg-ai.gateway';
import { TextToImageGatewayAI } from '@infra/gateways/ai/text-to-image-ai.gateway';
import { UpscaleGatewayAI } from '@infra/gateways/ai/upscale-ai.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';
import { CreditPricing } from 'src/shared/config/credit-pricing';
import { calculateCreditsFromCost } from 'src/shared/utils/credit-calculator';

/**
 * Upscale: pricing is per compute-second.
 * Estimated seconds based on scale factor (higher scale = more compute).
 */
const UPSCALE_ESTIMATED_SECONDS: Record<number, number> = {
  1: 2,
  2: 3,
  3: 5,
  4: 7,
  5: 9,
  6: 12,
  7: 15,
  8: 18,
};

/**
 * LTX-2.3 video: pricing varies by resolution.
 * Base unit_price from API is for 1080p. Multipliers for higher resolutions.
 */
const VIDEO_RESOLUTION_MULTIPLIER: Record<string, number> = {
  [VideoResolutionEnum['1080p']]: 1.0,
  [VideoResolutionEnum['1440p']]: 2.0,
  [VideoResolutionEnum['2160p']]: 4.0,
};

/**
 * Kling v3 video: pricing varies by audio setting.
 * Base unit_price from API is without audio.
 */
const KLING_AUDIO_MULTIPLIER = {
  withoutAudio: 1.0,
  withAudio: 1.5, // $0.168 / $0.112
};

@Injectable()
export class CreditService {
  constructor(
    private readonly accountBalanceRepository: AccountBalanceDrizzleRepository,
    private readonly falPricingGateway: FalPricingGateway,
  ) {}

  async calculateForGenerationNode(params: {
    generatorNodeData: NodeEntity.GenerationData;
  }): Promise<{
    creditsRequired: number;
  }> {
    const quality = params.generatorNodeData.quality || ('1K' as QualityEnum);
    const costUsd = await this.falPricingGateway.getCostForQuality(ImageGatewayAI.Model, quality);
    return {
      creditsRequired: calculateCreditsFromCost(costUsd),
    };
  }

  async calculateForTextToImageNode(params: {
    generatorNodeData: NodeEntity.TextToImageData;
  }): Promise<{
    creditsRequired: number;
  }> {
    const quality = params.generatorNodeData.quality || ('1K' as QualityEnum);
    const costUsd = await this.falPricingGateway.getCostForQuality(
      TextToImageGatewayAI.Model,
      quality,
    );
    return {
      creditsRequired: calculateCreditsFromCost(costUsd),
    };
  }

  async calculateForUpscaleNode(params: { generatorNodeData: NodeEntity.UpscaleData }): Promise<{
    creditsRequired: number;
  }> {
    const unitPrice = await this.falPricingGateway.getUnitPrice(UpscaleGatewayAI.Model);
    const estimatedSeconds = UPSCALE_ESTIMATED_SECONDS[params.generatorNodeData.scale] ?? 5;
    const costUsd = unitPrice * estimatedSeconds;
    return {
      creditsRequired: calculateCreditsFromCost(costUsd),
    };
  }

  async calculateForRemoveBgNode(): Promise<{
    creditsRequired: number;
  }> {
    const costUsd = await this.falPricingGateway.getUnitPrice(RemoveBgGatewayAI.Model);
    return {
      creditsRequired: calculateCreditsFromCost(costUsd),
    };
  }

  async calculateForImageToVideoNode(params: {
    tier: VideoTierEnum;
    duration: string;
    resolution: string;
    generateAudio: boolean;
  }): Promise<{
    creditsRequired: number;
  }> {
    const model =
      params.tier === VideoTierEnum.STANDARD
        ? 'fal-ai/ltx-2.3/image-to-video'
        : 'fal-ai/kling-video/v3/pro/image-to-video';

    const unitPrice = await this.falPricingGateway.getUnitPrice(model);
    const durationSeconds = Number(params.duration);

    let costUsd: number;

    if (params.tier === VideoTierEnum.STANDARD) {
      const resMultiplier = VIDEO_RESOLUTION_MULTIPLIER[params.resolution] ?? 1.0;
      costUsd = unitPrice * durationSeconds * resMultiplier;
    } else {
      const audioMultiplier = params.generateAudio
        ? KLING_AUDIO_MULTIPLIER.withAudio
        : KLING_AUDIO_MULTIPLIER.withoutAudio;
      costUsd = unitPrice * durationSeconds * audioMultiplier;
    }

    return {
      creditsRequired: calculateCreditsFromCost(costUsd, CreditPricing.videoMarkupMultiplier),
    };
  }

  async calculateForMotionControlNode(params: {
    duration: number;
    keepOriginalSound: boolean;
  }): Promise<{
    creditsRequired: number;
  }> {
    const unitPrice = await this.falPricingGateway.getUnitPrice(
      'fal-ai/kling-video/v3/pro/motion-control',
    );
    const audioMultiplier = params.keepOriginalSound
      ? KLING_AUDIO_MULTIPLIER.withAudio
      : KLING_AUDIO_MULTIPLIER.withoutAudio;
    const costUsd = unitPrice * params.duration * audioMultiplier;
    return {
      creditsRequired: calculateCreditsFromCost(costUsd, CreditPricing.videoMarkupMultiplier),
    };
  }

  async debitAccount(
    accountId: string,
    consumedCredits: number,
    tx?: import('@infra/database/drizzle/db').Transaction,
  ) {
    const accountBalance = await this.accountBalanceRepository.findByAccountId(accountId, tx);

    if (!accountBalance) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Account balance not found');
    }

    accountBalance.updateAttributes({
      balance: accountBalance.attrs.balance - consumedCredits,
      lifetimeSpent: (accountBalance.attrs.lifetimeSpent || 0) + consumedCredits,
    });

    await this.accountBalanceRepository.update(accountBalance, tx);

    return accountBalance;
  }
}
