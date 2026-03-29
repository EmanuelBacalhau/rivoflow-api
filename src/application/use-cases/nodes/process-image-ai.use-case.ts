import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { GenerationStatusEnum } from '@application/entities/node-enums';
import { NodeValidationService } from '@application/services/node-validation.service';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { ImageGatewayAI } from '@infra/gateways/ai/image-ai.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';

const MAX_ATTEMPTS = 3;

interface ProcessImageAIUseCaseInput {
  flowId: string;
  nodeGeneratorId: string;
  inputs: string[];
  accountId: string;
}

@Injectable()
export class ProcessImageAIUseCase implements IUseCase<ProcessImageAIUseCaseInput, void> {
  constructor(
    private readonly nodeRepository: NodeDrizzleRepository,
    private readonly imageGatewayAI: ImageGatewayAI,
    private readonly nodeValidationService: NodeValidationService,
    private readonly appConfig: AppConfig,
  ) {}

  async execute(params: ProcessImageAIUseCaseInput): Promise<void> {
    const { flowId, nodeGeneratorId, inputs, accountId } = params;

    const nodes = await this.nodeRepository.findNodesByIds({
      flowId,
      nodeIds: inputs.concat(nodeGeneratorId),
    });

    const rawNodeGenerator = nodes.find((node) => node.attrs.id === nodeGeneratorId);
    const generator = this.nodeValidationService.validateGeneratorNode(rawNodeGenerator);
    const promptNode = this.nodeValidationService.findPromptNode(nodes);
    const imageNodes = this.nodeValidationService.findImageNodes(nodes);

    try {
      await this.submit(flowId, generator, promptNode, imageNodes, accountId);
    } catch (error) {
      await this.handleError(generator, error);
    }
  }

  private async submit(
    flowId: string,
    generator: NodeEntity,
    promptNode: NodeEntity | undefined,
    imageNodes: NodeEntity[],
    accountId: string,
  ): Promise<void> {
    if (!generator.isGeneration()) return;

    const genData = generator.attrs.data;

    this.updateGeneratorStatus(generator, GenerationStatusEnum.PROCESSING, genData.attempts + 1);
    await this.nodeRepository.update(generator);

    const images: {
      key: string;
    }[] = [];
    for (const n of imageNodes) {
      if (n.isImage() && n.attrs.data.key) {
        images.push({
          key: n.attrs.data.key,
        });
      }
    }

    const webhookUrl = `${this.appConfig.ai.falWebhookBaseUrl}/webhooks/fal-ai?secret=${this.appConfig.ai.falWebhookSecret}`;

    const { requestId } = await this.imageGatewayAI.submit(
      {
        images,
        prompt: promptNode?.isPrompt() ? promptNode.attrs.data.prompt : '',
        parameters: {
          aspectRatio: genData.aspectRatio,
          quality: genData.quality,
        },
        accountId,
        flowId,
      },
      webhookUrl,
    );

    generator.updateAttributes({
      data: {
        ...generator.attrs.data,
        falRequestId: requestId,
      },
    });
    await this.nodeRepository.update(generator);
  }

  private updateGeneratorStatus(
    generator: NodeEntity,
    status: GenerationStatusEnum,
    attempts?: number,
  ): void {
    if (!generator.isGeneration()) return;

    generator.updateAttributes({
      data: {
        ...generator.attrs.data,
        status,
        ...(attempts !== undefined && {
          attempts,
        }),
      },
    });
  }

  private async handleError(generator: NodeEntity, error: unknown): Promise<never> {
    if (generator.isGeneration()) {
      const shouldFail = generator.attrs.data.attempts >= MAX_ATTEMPTS;
      const newStatus = shouldFail ? GenerationStatusEnum.FAILED : GenerationStatusEnum.QUEUED;
      this.updateGeneratorStatus(generator, newStatus);
      await this.nodeRepository.update(generator);
    }

    throw error;
  }
}
