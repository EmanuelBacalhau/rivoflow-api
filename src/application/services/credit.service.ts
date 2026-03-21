import { NodeEntity } from '@application/entities/node.entity';
import { QualityEnum } from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { AccountBalanceDynamoRepository } from '@infra/database/dynamo/repositories/account-balance-dynamo.repository';
import { GoogleTokensAIGateway } from '@infra/gateways/ai/google-tokens-ai.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';
import { calculateCreditsRequired } from 'src/shared/utils/credit-calculator';
import { NodeValidationService } from './node-validation.service';

@Injectable()
export class CreditService {
  constructor(
    private readonly googleTokensAIGateway: GoogleTokensAIGateway,
    private readonly accountBalanceRepository: AccountBalanceDynamoRepository,
    private readonly nodeValidationService: NodeValidationService,
  ) {}

  async calculateForGenerationNode(params: {
    generatorNodeData: NodeEntity.GenerationImageNodeData;
    inputNodes: NodeEntity[];
  }): Promise<{
    creditsRequired: number;
    promptTokens: number;
    imageTokens: number;
  }> {
    const { parameters } = params.generatorNodeData;

    const imageCount = this.nodeValidationService.findImageNodes(params.inputNodes).length;

    const promptNode = params.inputNodes.find(
      (n) => n.attrs.data.type === NodeEntity.NodeType.PROMPT,
    );
    const promptText =
      promptNode && promptNode.attrs.data.type === NodeEntity.NodeType.PROMPT
        ? promptNode.attrs.data.prompt
        : '';

    const contents = promptText
      ? [
          {
            text: promptText,
          },
        ]
      : [];

    const promptTokens =
      contents.length > 0
        ? await this.googleTokensAIGateway.countTokensForPrompt(contents as any[])
        : 0;

    if (promptTokens === 0 && imageCount === 0) {
      return {
        creditsRequired: 0,
        promptTokens: 0,
        imageTokens: 0,
      };
    }

    const creditsRequired = calculateCreditsRequired({
      promptTokens,
      imageTokens: imageCount,
      quality: parameters?.quality || ('1K' as QualityEnum),
    });

    return {
      creditsRequired,
      promptTokens,
      imageTokens: imageCount,
    };
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
