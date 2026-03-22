import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { GenerationStatusEnum } from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { CreditService } from '@application/services/credit.service';
import { AccountDrizzleRepository } from '@infra/database/drizzle/repositories/account-drizzle.repository';
import { EdgeDrizzleRepository } from '@infra/database/drizzle/repositories/edge-drizzle.repository';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { DrizzleTransaction } from '@infra/database/drizzle/drizzle-transaction';
import { ImageSQSGateway } from '@infra/gateways/aws/image-sqs.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

interface CreateImageAIUseCaseInput {
  flowId: string;
  nodeGeneratorId: string;
  accountId: string;
}

@Injectable()
export class CreateImageAIUseCase implements IUseCase<CreateImageAIUseCaseInput, void> {
  constructor(
    private readonly imageSQSGateway: ImageSQSGateway,
    private readonly nodeRepository: NodeDrizzleRepository,
    private readonly edgeRepository: EdgeDrizzleRepository,
    private readonly accountRepository: AccountDrizzleRepository,
    private readonly creditService: CreditService,
    private readonly transactWrite: DrizzleTransaction,
  ) {}

  async execute(params: CreateImageAIUseCaseInput): Promise<void> {
    const { flowId, nodeGeneratorId, accountId } = params;

    const account = await this.accountRepository.findByIdWithBalance(accountId);
    if (!account) throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Account not found');
    if (account.attrs.balance.attrs.balance <= 0) {
      throw new ApplicationError(ErrorCode.VALIDATION_ERROR, 'Insufficient balance to generate an image');
    }

    const generatorNode = await this.nodeRepository.findById(nodeGeneratorId, flowId);
    if (!generatorNode || !generatorNode.isAnyGeneration()) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Generator node not found');
    }

    const edges = await this.edgeRepository.findByTargetNodeId({ flowId, targetNodeId: nodeGeneratorId });
    const inputs = edges.map((e) => e.attrs.sourceNodeId);
    const inputNodes = inputs.length > 0
      ? await this.nodeRepository.findNodesByIds({ flowId, nodeIds: inputs })
      : [];

    const { modelType, creditsRequired } = await this.resolveModelType(generatorNode, inputNodes);

    if (account.attrs.balance.attrs.balance < creditsRequired) {
      throw new ApplicationError(ErrorCode.VALIDATION_ERROR,
        `Insufficient balance. Required: ${creditsRequired}, Available: ${account.attrs.balance.attrs.balance}`,
      );
    }

    this.setNodeQueued(generatorNode);

    inputNodes.forEach((n) => {
      n.updateAttributes({ isExecuted: true });
    });

    const allNodes = [generatorNode, ...inputNodes];

    await this.transactWrite.execute(async (tx) => {
      for (const node of allNodes) {
        await this.nodeRepository.update(node, tx);
      }
    });

    await this.imageSQSGateway.publish({ flowId, nodeGeneratorId, inputs, accountId, modelType });
  }

  private async resolveModelType(
    generator: NodeEntity,
    inputNodes: NodeEntity[],
  ): Promise<{ modelType: ImageSQSGateway.ModelType; creditsRequired: number }> {
    const promptNode = inputNodes.find(
      (n) => n.isPrompt() && n.attrs.data.prompt && n.attrs.data.prompt.length >= 3,
    );
    const imageNodes = inputNodes.filter((n) => n.isImage() && n.attrs.data.key);

    if (generator.isGeneration()) {
      if (!promptNode) throw new ApplicationError(ErrorCode.VALIDATION_ERROR, 'A prompt with at least 3 characters is required');
      if (imageNodes.length === 0) throw new ApplicationError(ErrorCode.VALIDATION_ERROR, 'At least one image is required for editing');
      const { creditsRequired } = await this.creditService.calculateForGenerationNode({ generatorNodeData: generator.attrs.data });
      return { modelType: 'image-edit', creditsRequired };
    }

    if (generator.isTextToImage()) {
      if (!promptNode) throw new ApplicationError(ErrorCode.VALIDATION_ERROR, 'A prompt with at least 3 characters is required');
      const { creditsRequired } = await this.creditService.calculateForTextToImageNode({ generatorNodeData: generator.attrs.data });
      return { modelType: 'text-to-image', creditsRequired };
    }

    if (generator.isUpscale()) {
      if (imageNodes.length === 0) throw new ApplicationError(ErrorCode.VALIDATION_ERROR, 'An image is required for upscaling');
      const { creditsRequired } = await this.creditService.calculateForUpscaleNode();
      return { modelType: 'upscale', creditsRequired };
    }

    if (generator.isRemoveBg()) {
      if (imageNodes.length === 0) throw new ApplicationError(ErrorCode.VALIDATION_ERROR, 'An image is required for background removal');
      const { creditsRequired } = await this.creditService.calculateForRemoveBgNode();
      return { modelType: 'remove-bg', creditsRequired };
    }

    if (generator.isImageToVideo()) {
      if (imageNodes.length === 0) throw new ApplicationError(ErrorCode.VALIDATION_ERROR, 'An image is required for video generation');
      const { creditsRequired } = await this.creditService.calculateForImageToVideoNode({
        tier: generator.attrs.data.tier,
        duration: generator.attrs.data.duration,
      });
      return { modelType: 'image-to-video', creditsRequired };
    }

    throw new ApplicationError(ErrorCode.VALIDATION_ERROR, 'Unknown generator node type');
  }

  private setNodeQueued(generator: NodeEntity): void {
    if (generator.isGeneration()) {
      generator.updateAttributes({ data: { ...generator.attrs.data, status: GenerationStatusEnum.QUEUED }, isExecuted: true });
    } else if (generator.isTextToImage()) {
      generator.updateAttributes({ data: { ...generator.attrs.data, status: GenerationStatusEnum.QUEUED }, isExecuted: true });
    } else if (generator.isUpscale()) {
      generator.updateAttributes({ data: { ...generator.attrs.data, status: GenerationStatusEnum.QUEUED }, isExecuted: true });
    } else if (generator.isRemoveBg()) {
      generator.updateAttributes({ data: { ...generator.attrs.data, status: GenerationStatusEnum.QUEUED }, isExecuted: true });
    } else if (generator.isImageToVideo()) {
      generator.updateAttributes({ data: { ...generator.attrs.data, status: GenerationStatusEnum.QUEUED }, isExecuted: true });
    }
  }
}
