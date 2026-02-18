import { NodeEntity } from '@application/entities/node.entity';

/**
 * Gemini image model pricing constants.
 * Source: https://ai.google.dev/gemini-api/docs/models#gemini-3-pro-image-preview
 *
 * Input:  $2.00 / 1M tokens  → each input image = 560 tokens (fixed)
 * Output: $120.00 / 1M tokens → each output image tokens depend on quality
 */
export const GeminiPricing = {
  inputImageTokens: 560,

  outputImageTokens: {
    [NodeEntity.QualityEnum['1K']]: 1120,
    [NodeEntity.QualityEnum['2K']]: 1120,
    [NodeEntity.QualityEnum['4K']]: 2000,
  } as Record<NodeEntity.QualityEnum, number>,

  usdPerMillionTokens: {
    input: 2.00,
    output: 120.00,
  },
} as const;
