import { NodeEntity } from '@application/entities/node.entity';
import { GoogleTokensAIGateway } from '@infra/gateways/ai/google-tokens-ai.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';
import { calculateCreditsRequired } from 'src/shared/utils/credit-calculator';

@Injectable()
export class CreditCalculationService {
  constructor(private readonly googleTokensAIGateway: GoogleTokensAIGateway) {}

  async calculateForGenerationNode(params: {
    generatorNodeData: NodeEntity.NodeDataGenerationImage;
    inputNodes: NodeEntity[];
  }): Promise<{
    creditsRequired: number;
    promptTokens: number;
    imageTokens: number;
  }> {
    const { parameters } = params.generatorNodeData;

    const imageCount = params.inputNodes.filter(
      (n) => NodeEntity.isFileData(n.attrs.data) && n.attrs.data.key,
    ).length;

    const promptNode = params.inputNodes.find((n) => NodeEntity.isPromptData(n.attrs.data));
    const promptText =
      promptNode && NodeEntity.isPromptData(promptNode.attrs.data)
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
      quality: parameters.quality,
    });

    return {
      creditsRequired,
      promptTokens,
      imageTokens: imageCount,
    };
  }
}
