import { NodeEntity } from '@application/entities/node.entity';
import { QualityEnum, VideoTierEnum } from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { AccountBalanceDrizzleRepository } from '@infra/database/drizzle/repositories/account-balance-drizzle.repository';
import { FalPricingGateway } from '@infra/gateways/ai/fal-pricing.gateway';
import { ImageGatewayAI } from '@infra/gateways/ai/image-ai.gateway';
import { RemoveBgGatewayAI } from '@infra/gateways/ai/remove-bg-ai.gateway';
import { TextToImageGatewayAI } from '@infra/gateways/ai/text-to-image-ai.gateway';
import { UpscaleGatewayAI } from '@infra/gateways/ai/upscale-ai.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';
import { calculateCreditsFromCost } from 'src/shared/utils/credit-calculator';

@Injectable()
export class CreditService {
  constructor(
    private readonly accountBalanceRepository: AccountBalanceDrizzleRepository,
    private readonly falPricingGateway: FalPricingGateway,
  ) {}

  async calculateForGenerationNode(params: {
    generatorNodeData: NodeEntity.GenerationData;
  }): Promise<{ creditsRequired: number }> {
    const quality = params.generatorNodeData.quality || ('1K' as QualityEnum);
    const costUsd = await this.falPricingGateway.getCostForQuality(ImageGatewayAI.Model, quality);
    return { creditsRequired: calculateCreditsFromCost(costUsd) };
  }

  async calculateForTextToImageNode(params: {
    generatorNodeData: NodeEntity.TextToImageData;
  }): Promise<{ creditsRequired: number }> {
    const quality = params.generatorNodeData.quality || ('1K' as QualityEnum);
    const costUsd = await this.falPricingGateway.getCostForQuality(TextToImageGatewayAI.Model, quality);
    return { creditsRequired: calculateCreditsFromCost(costUsd) };
  }

  async calculateForUpscaleNode(): Promise<{ creditsRequired: number }> {
    const costUsd = await this.falPricingGateway.getUnitPrice(UpscaleGatewayAI.Model);
    return { creditsRequired: calculateCreditsFromCost(costUsd) };
  }

  async calculateForRemoveBgNode(): Promise<{ creditsRequired: number }> {
    const costUsd = await this.falPricingGateway.getUnitPrice(RemoveBgGatewayAI.Model);
    return { creditsRequired: calculateCreditsFromCost(costUsd) };
  }

  async calculateForImageToVideoNode(params: {
    tier: VideoTierEnum;
    duration: string;
  }): Promise<{ creditsRequired: number }> {
    const model = params.tier === VideoTierEnum.STANDARD
      ? 'fal-ai/ltx-2.3/image-to-video'
      : 'fal-ai/kling-video/v3/pro/image-to-video';
    const unitPrice = await this.falPricingGateway.getUnitPrice(model);
    const costUsd = unitPrice * Number(params.duration);
    return { creditsRequired: calculateCreditsFromCost(costUsd) };
  }

  async debitAccount(accountId: string, consumedCredits: number) {
    const accountBalance = await this.accountBalanceRepository.findByAccountId(accountId);

    if (!accountBalance) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Account balance not found');
    }

    accountBalance.updateAttributes({
      balance: accountBalance.attrs.balance - consumedCredits,
      lifetimeSpent: (accountBalance.attrs.lifetimeSpent || 0) + consumedCredits,
    });

    await this.accountBalanceRepository.update(accountBalance);

    return accountBalance;
  }
}
