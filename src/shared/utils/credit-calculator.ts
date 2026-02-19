import { NodeEntity } from '@application/entities/node.entity';
import { CreditPricing } from '../config/credit-pricing';
import { GeminiPricing } from '../config/gemini-pricing';

export interface CreditCalculatorParams {
  promptTokens: number;
  imageTokens: number;
  quality: NodeEntity.QualityEnum;
}

export function calculateCreditsRequired(params: CreditCalculatorParams): number {
  const { promptTokens, imageTokens, quality } = params;

  const inputTokens = promptTokens + imageTokens * GeminiPricing.inputImageTokens;
  const outputTokens = GeminiPricing.outputImageTokens[quality];

  const inputCostUsd = (inputTokens / 1_000_000) * GeminiPricing.usdPerMillionTokens.input;
  const outputCostUsd = (outputTokens / 1_000_000) * GeminiPricing.usdPerMillionTokens.output;

  const totalWithMarkup = (inputCostUsd + outputCostUsd) * CreditPricing.markupMultiplier;

  return Math.ceil(totalWithMarkup / CreditPricing.usdPerCredit);
}
