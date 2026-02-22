import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { InvalidNodeTypeError } from '@application/errors/application/invalid-node-type.error';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { GoogleTokensAIGateway } from '@infra/gateways/ai/google-tokens-ai.gateway';
import { ImageGatewayAI } from '@infra/gateways/ai/image-ai.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';
import { calculateCreditsRequired } from 'src/shared/utils/credit-calculator';

type CalculateCreditsNodeGeneratorUseCaseInput = {
  nodeId: string;
  flowId: string;
};

type CalculateCreditsNodeGeneratorUseCaseOutput = {
  creditsRequired: number;
};

@Injectable()
export class CalculateCreditsNodeGeneratorUseCase
  implements
    IUseCase<CalculateCreditsNodeGeneratorUseCaseInput, CalculateCreditsNodeGeneratorUseCaseOutput>
{
  constructor(
    private readonly nodeRepository: NodeDynamoRepository,
    private readonly imageGatewayAI: GoogleTokensAIGateway,
  ) {}

  async execute(
    params: CalculateCreditsNodeGeneratorUseCaseInput,
  ): Promise<CalculateCreditsNodeGeneratorUseCaseOutput> {
    const { nodeId, flowId } = params;

    const node = await this.nodeRepository.findById(nodeId, flowId);

    if (!node) {
      throw new ResourceNotFoundError('Node not found');
    }

    if (node.attrs.data.type !== NodeEntity.NodeType.GENERATION_IMAGE) {
      throw new InvalidNodeTypeError('Node is not a generation image type');
    }

    const nodeData = node.attrs.data as NodeEntity.NodeDataGenerationImage;

    const { parameters, inputs } = nodeData;

    if (!inputs || inputs.length === 0) {
      return {
        creditsRequired: 0,
      };
    }

    const nodes = await this.nodeRepository.findNodesByIds({
      flowId,
      nodeIds: inputs,
    });

    const imageCount = nodes.filter(
      (n) =>
        (n.attrs.data.type === NodeEntity.NodeType.IMAGE ||
          n.attrs.data.type === NodeEntity.NodeType.RESULT_IMAGE) &&
        n.attrs.data.key,
    ).length;

    const promptNode = nodes.find((n) => n.attrs.data.type === NodeEntity.NodeType.PROMPT);
    const promptText = promptNode
      ? (promptNode.attrs.data as NodeEntity.NodeDataPrompt).prompt
      : '';

    const contents: ImageGatewayAI.ContentType[] = [];

    if (promptText) {
      contents.push({
        text: promptText,
      });
    }

    const promptTokens =
      contents.length > 0 ? await this.imageGatewayAI.countTokensForPrompt(contents) : 0;

    if (promptTokens === 0 && imageCount === 0) {
      return {
        creditsRequired: 0,
      };
    }

    const creditsRequired = calculateCreditsRequired({
      promptTokens,
      imageTokens: imageCount,
      quality: parameters.quality,
    });

    return {
      creditsRequired,
    };
  }
}
