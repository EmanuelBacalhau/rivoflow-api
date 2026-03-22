import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { GenerationStatusEnum } from '@application/entities/node-enums';
import { NodeValidationService } from '@application/services/node-validation.service';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { ImageToVideoGatewayAI } from '@infra/gateways/ai/image-to-video-ai.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';

const MAX_ATTEMPTS = 3;

interface ProcessImageToVideoInput {
  flowId: string;
  nodeGeneratorId: string;
  inputs: string[];
  accountId: string;
}

@Injectable()
export class ProcessImageToVideoUseCase implements IUseCase<ProcessImageToVideoInput, void> {
  constructor(
    private readonly nodeRepository: NodeDrizzleRepository,
    private readonly imageToVideoGateway: ImageToVideoGatewayAI,
    private readonly nodeValidationService: NodeValidationService,
    private readonly appConfig: AppConfig,
  ) {}

  async execute(params: ProcessImageToVideoInput): Promise<void> {
    const { flowId, nodeGeneratorId, inputs, accountId } = params;

    const nodes = await this.nodeRepository.findNodesByIds({
      flowId,
      nodeIds: inputs.concat(nodeGeneratorId),
    });

    const rawGenerator = nodes.find((n) => n.attrs.id === nodeGeneratorId);
    if (!rawGenerator || !rawGenerator.isImageToVideo()) return;

    const generator = rawGenerator;
    const imageNodes = this.nodeValidationService.findImageNodes(nodes);
    const promptNode = this.nodeValidationService.findPromptNode(nodes);

    try {
      const genData = generator.attrs.data;

      this.updateGeneratorStatus(generator, GenerationStatusEnum.PROCESSING, genData.attempts + 1);
      await this.nodeRepository.update(generator);

      const validImageNodes = imageNodes.filter((n) => n.isImage() && n.attrs.data.key);
      if (validImageNodes.length === 0) {
        throw new Error('No valid image node found for video generation');
      }

      const startImage = validImageNodes[0] as NodeEntity & { attrs: { data: NodeEntity.FileData } };
      const endImage = validImageNodes.length > 1
        ? validImageNodes[1] as NodeEntity & { attrs: { data: NodeEntity.FileData } }
        : undefined;

      const prompt = promptNode?.isPrompt() ? promptNode.attrs.data.prompt : '';

      const webhookUrl = `${this.appConfig.ai.falWebhookBaseUrl}/webhooks/fal-ai?secret=${this.appConfig.ai.falWebhookSecret}`;

      const { requestId } = await this.imageToVideoGateway.submit(
        {
          imageKey: startImage.attrs.data.key as string,
          endImageKey: endImage?.attrs.data.key ?? undefined,
          prompt,
          tier: genData.tier,
          duration: genData.duration,
          resolution: genData.resolution,
          aspectRatio: genData.aspectRatio,
          generateAudio: genData.generateAudio,
          accountId,
          flowId,
        },
        webhookUrl,
      );

      generator.updateAttributes({
        data: { ...generator.attrs.data, falRequestId: requestId },
      });
      await this.nodeRepository.update(generator);
    } catch (error) {
      const genData = generator.attrs.data;
      const shouldFail = genData.attempts >= MAX_ATTEMPTS;
      this.updateGeneratorStatus(generator, shouldFail ? GenerationStatusEnum.FAILED : GenerationStatusEnum.QUEUED);
      await this.nodeRepository.update(generator);
      throw error;
    }
  }

  private updateGeneratorStatus(generator: NodeEntity, status: GenerationStatusEnum, attempts?: number): void {
    if (!generator.isImageToVideo()) return;
    generator.updateAttributes({
      data: {
        ...generator.attrs.data,
        status,
        ...(attempts !== undefined && { attempts }),
      },
    });
  }
}
