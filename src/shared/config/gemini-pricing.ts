import { QualityEnum } from '@application/entities/node-enums';

/**
 * Gemini image model pricing constants.
 * Source: https://ai.google.dev/gemini-api/docs/models
 *
 */
export const GeminiPricing = {
  inputImageTokens: 560,

  outputImageTokens: {
    [QualityEnum['0.5K']]: 747,
    [QualityEnum['1K']]: 1120,
    [QualityEnum['2K']]: 1680,
    [QualityEnum['4K']]: 2520,
  } as Record<QualityEnum, number>,

  usdPerMillionTokens: {
    input: 0.5,
    outputImage: 60.0,
    outputText: 3.0,
  },
} as const;
