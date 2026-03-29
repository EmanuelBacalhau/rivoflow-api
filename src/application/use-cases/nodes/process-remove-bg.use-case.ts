import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { GenerationStatusEnum } from '@application/entities/node-enums';
import { NodeValidationService } from '@application/services/node-validation.service';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { RemoveBgGatewayAI } from '@infra/gateways/ai/remove-bg-ai.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';

const MAX_ATTEMPTS = 3;

interface ProcessRemoveBgInput {
  flowId: string;
  nodeGeneratorId: string;
  inputs: string[];
  accountId: string;
}

@Injectable()
export class ProcessRemoveBgUseCase implements IUseCase<ProcessRemoveBgInput, void> {
  constructor(
    private readonly nodeRepository: NodeDrizzleRepository,
    private readonly removeBgGateway: RemoveBgGatewayAI,
    private readonly nodeValidationService: NodeValidationService,
    private readonly appConfig: AppConfig,
  ) {}

  async execute(params: ProcessRemoveBgInput): Promise<void> {
    const { flowId, nodeGeneratorId, inputs, accountId } = params;

    const nodes = await this.nodeRepository.findNodesByIds({
      flowId,
      nodeIds: inputs.concat(nodeGeneratorId),
    });

    const rawGenerator = nodes.find((n) => n.attrs.id === nodeGeneratorId);
    if (!rawGenerator || !rawGenerator.isRemoveBg()) return;

    const generator = rawGenerator;
    const imageNodes = this.nodeValidationService.findImageNodes(nodes);

    try {
      const genData = generator.attrs.data;

      this.updateGeneratorStatus(generator, GenerationStatusEnum.PROCESSING, genData.attempts + 1);
      await this.nodeRepository.update(generator);

      const imageNode = imageNodes.find((n) => n.isImage() && n.attrs.data.key);
      if (!imageNode || !imageNode.isImage() || !imageNode.attrs.data.key) {
        throw new Error('No valid image node found for background removal');
      }

      const webhookUrl = `${this.appConfig.ai.falWebhookBaseUrl}/webhooks/fal-ai?secret=${this.appConfig.ai.falWebhookSecret}`;

      const { requestId } = await this.removeBgGateway.submit(
        {
          imageKey: imageNode.attrs.data.key,
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
    } catch (error) {
      const genData = generator.attrs.data;
      const shouldFail = genData.attempts >= MAX_ATTEMPTS;
      this.updateGeneratorStatus(
        generator,
        shouldFail ? GenerationStatusEnum.FAILED : GenerationStatusEnum.QUEUED,
      );
      await this.nodeRepository.update(generator);
      throw error;
    }
  }

  private updateGeneratorStatus(
    generator: NodeEntity,
    status: GenerationStatusEnum,
    attempts?: number,
  ): void {
    if (!generator.isRemoveBg()) return;
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
}
