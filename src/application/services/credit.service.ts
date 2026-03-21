import { NodeEntity } from '@application/entities/node.entity';
import { QualityEnum } from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { AccountBalanceDrizzleRepository } from '@infra/database/drizzle/repositories/account-balance-drizzle.repository';
import { FalPricingGateway } from '@infra/gateways/ai/fal-pricing.gateway';
import { ImageGatewayAI } from '@infra/gateways/ai/image-ai.gateway';
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
  }): Promise<{
    creditsRequired: number;
  }> {
    const quality = params.generatorNodeData.quality || ('1K' as QualityEnum);

    const costUsd = await this.falPricingGateway.getCostForQuality(
      ImageGatewayAI.Model,
      quality,
    );

    const creditsRequired = calculateCreditsFromCost(costUsd);

    return { creditsRequired };
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
