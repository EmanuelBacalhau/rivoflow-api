import { NodeEntity } from '@application/entities/node.entity';
import { QualityEnum } from '@application/entities/node-enums';
import { GoogleTokensAIGateway } from '@infra/gateways/ai/google-tokens-ai.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';
import { calculateCreditsRequired } from 'src/shared/utils/credit-calculator';

@Injectable()
export class CreditCalculationService {
  constructor(private readonly googleTokensAIGateway: GoogleTokensAIGateway) {}

  async calculateForGenerationNode(params: {
    generatorNodeData: NodeEntity.GenerationImageNodeData;
    inputNodes: NodeEntity[];
  }): Promise<{
    creditsRequired: number;
    promptTokens: number;
    imageTokens: number;
  }> {
    const { parameters } = params.generatorNodeData;

    const imageCount = params.inputNodes.filter(
      (n) =>
        (n.attrs.data.type === NodeEntity.NodeType.IMAGE ||
          n.attrs.data.type === NodeEntity.NodeType.RESULT_IMAGE) &&
        n.attrs.data.key,
    ).length;

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
}
