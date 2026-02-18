import { ExternalServiceError } from '@application/errors/application/external-service.error';
import { GoogleGenAI } from '@google/genai';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';

@Injectable()
export class GoogleTokensAIGateway {
  private readonly ai: GoogleGenAI;
  constructor(private readonly appConfig: AppConfig) {
    this.ai = new GoogleGenAI({
      apiKey: this.appConfig.ai.nanobananaApiKey,
    });
  }

  async countTokensForPrompt(prompt: string): Promise<number> {
    try {
      const tokens = await this.ai.models.countTokens({
        model: 'gemini-3-pro-image-preview',
        contents: prompt,
      });

      return tokens.totalTokens ?? 0;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown AI error';
      throw new ExternalServiceError(`Failed to count tokens for prompt: ${message}`);
    }
  }

}
