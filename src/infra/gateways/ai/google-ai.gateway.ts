import { GoogleGenAI } from '@google/genai';
import { Injectable } from 'src/kernel/decorators/injectable';

@Injectable()
export class GoogleAIGateway {
  private createClient(): GoogleGenAI {
    return new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY!,
    });
  }

  async countTokensForPrompt(prompt: string): Promise<number> {
    const ai = this.createClient();

    const tokens = await ai.models.countTokens({
      model: 'gemini-3-pro-image-preview',
      contents: prompt,
    });

    return tokens.totalTokens ?? 0;
  }

  async countTokensForImage(buffer: Buffer, mimeType: string): Promise<number> {
    const ai = this.createClient();

    const tokens = await ai.models.countTokens({
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
