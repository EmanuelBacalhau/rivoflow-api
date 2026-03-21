import { NodeEntity } from '@application/entities/node.entity';
import { QualityEnum } from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { AccountBalanceDrizzleRepository } from '@infra/database/drizzle/repositories/account-balance-drizzle.repository';
import { GoogleTokensAIGateway } from '@infra/gateways/ai/google-tokens-ai.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';
import { calculateCreditsRequired } from 'src/shared/utils/credit-calculator';
import { NodeValidationService } from './node-validation.service';

@Injectable()
export class CreditService {
  constructor(
    private readonly googleTokensAIGateway: GoogleTokensAIGateway,
    private readonly accountBalanceRepository: AccountBalanceDrizzleRepository,
    private readonly nodeValidationService: NodeValidationService,
  ) {}

  async calculateForGenerationNode(params: {
    generatorNodeData: NodeEntity.GenerationData;
    inputNodes: NodeEntity[];
  }): Promise<{
    creditsRequired: number;
    promptTokens: number;
    imageTokens: number;
  }> {
    const { quality } = params.generatorNodeData;

    const imageCount = this.nodeValidationService.findImageNodes(params.inputNodes).length;
    const promptNode = this.nodeValidationService.findPromptNode(params.inputNodes);
    const promptText = promptNode?.isPrompt() ? promptNode.attrs.data.prompt : '';

    const promptTokens = promptText
      ? await this.googleTokensAIGateway.countTokensForPrompt([{ text: promptText }])
      : 0;

    if (promptTokens === 0 && imageCount === 0) {
      return { creditsRequired: 0, promptTokens: 0, imageTokens: 0 };
    }

    const creditsRequired = calculateCreditsRequired({
      promptTokens,
      imageTokens: imageCount,
      quality: quality || ('1K' as QualityEnum),
    });

    return { creditsRequired, promptTokens, imageTokens: imageCount };
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
