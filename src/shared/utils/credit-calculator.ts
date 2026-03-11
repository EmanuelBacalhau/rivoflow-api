import { QualityEnum } from '@application/entities/node-enums';
import { CreditPricing } from '../config/credit-pricing';
import { GeminiPricing } from '../config/gemini-pricing';

export interface CreditCalculatorParams {
  promptTokens: number;
  imageTokens: number;
  quality: QualityEnum;
}

export interface GeminiUsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
  thoughtsTokenCount?: number;
  promptTokensDetails?: Array<{
    modality: string;
    tokenCount: number;
  }>;
  candidatesTokensDetails?: Array<{
    modality: string;
    tokenCount: number;
  }>;
}

export function calculateCreditsRequired(params: CreditCalculatorParams): number {
  const { promptTokens, imageTokens, quality } = params;

  const THOUGHT_MULTIPLIER = 3;
  const estimatedThoughtsTokens = promptTokens * THOUGHT_MULTIPLIER;
  const textOutputCost = estimatedThoughtsTokens;

  const inputTokens = promptTokens + imageTokens * GeminiPricing.inputImageTokens;
  const outputTokens = GeminiPricing.outputImageTokens[quality];

  const inputCostUsd = (inputTokens / 1_000_000) * GeminiPricing.usdPerMillionTokens.input;
  const outputImageCostUsd =
    (outputTokens / 1_000_000) * GeminiPricing.usdPerMillionTokens.outputImage;
  const outputTextCostUsd =
    (textOutputCost / 1_000_000) * GeminiPricing.usdPerMillionTokens.outputText;

  const totalWithMarkup =
    (inputCostUsd + outputImageCostUsd + outputTextCostUsd) * CreditPricing.markupMultiplier;

  return Math.ceil(totalWithMarkup / CreditPricing.usdPerCredit);
}

export function calculateExactCreditsFromUsage(usage: GeminiUsageMetadata): number {
  const inputTokens = usage.promptTokenCount;

  const outputImageTokens =
    usage.candidatesTokensDetails
      ?.filter((d) => d.modality === 'IMAGE')
      .reduce((acc, curr) => acc + curr.tokenCount, 0) || 0;

  const outputTextTokens = usage.candidatesTokenCount - outputImageTokens;
  const thoughtsTokens = usage.thoughtsTokenCount || 0;

  const inputCostUsd = (inputTokens / 1_000_000) * GeminiPricing.usdPerMillionTokens.input;
  const outputImageCostUsd =
    (outputImageTokens / 1_000_000) * GeminiPricing.usdPerMillionTokens.outputImage;
  const outputTextCostUsd =
    ((outputTextTokens + thoughtsTokens) / 1_000_000) *
    GeminiPricing.usdPerMillionTokens.outputText;

  const totalWithMarkup =
    (inputCostUsd + outputImageCostUsd + outputTextCostUsd) * CreditPricing.markupMultiplier;
  return Math.ceil(totalWithMarkup / CreditPricing.usdPerCredit);
}
