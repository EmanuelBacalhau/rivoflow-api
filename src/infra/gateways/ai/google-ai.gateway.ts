import { GoogleGenAI } from '@google/genai';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';

@Injectable()
export class GoogleAIGateway {
  private readonly ai: GoogleGenAI;
  constructor(private readonly appConfig: AppConfig) {
    this.ai = new GoogleGenAI({
      apiKey: this.appConfig.ai.nanobananaApiKey,
    });
  }

  async countTokensForPrompt(prompt: string): Promise<number> {
    const tokens = await this.ai.models.countTokens({
      model: 'gemini-3-pro-image-preview',
      contents: prompt,
    });

    return tokens.totalTokens ?? 0;
  }

  async countTokensForImage(buffer: Buffer, mimeType: string): Promise<number> {
    const tokens = await this.ai.models.countTokens({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: buffer.toString('base64'),
            },
          },
        ],
      },
    });

    return tokens.totalTokens ?? 0;
  }
}
