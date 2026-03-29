import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { GenerationStatusEnum } from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { CreditService } from '@application/services/credit.service';
import { DrizzleTransaction } from '@infra/database/drizzle/drizzle-transaction';
import { AccountDrizzleRepository } from '@infra/database/drizzle/repositories/account-drizzle.repository';
import { EdgeDrizzleRepository } from '@infra/database/drizzle/repositories/edge-drizzle.repository';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { GenerationSQSGateway } from '@infra/gateways/aws/generation-sqs.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

interface TriggerGenerationUseCaseInput {
  flowId: string;
  nodeGeneratorId: string;
  accountId: string;
}

@Injectable()
export class TriggerGenerationUseCase implements IUseCase<TriggerGenerationUseCaseInput, void> {
  constructor(
    private readonly imageSQSGateway: GenerationSQSGateway,
    private readonly nodeRepository: NodeDrizzleRepository,
    private readonly edgeRepository: EdgeDrizzleRepository,
    private readonly accountRepository: AccountDrizzleRepository,
    private readonly creditService: CreditService,
    private readonly transactWrite: DrizzleTransaction,
  ) {}

  async execute(params: TriggerGenerationUseCaseInput): Promise<void> {
    const { flowId, nodeGeneratorId, accountId } = params;

    const account = await this.accountRepository.findByIdWithBalance(accountId);
    if (!account) throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Account not found');
    if (account.attrs.balance.attrs.balance <= 0) {
      throw new ApplicationError(ErrorCode.VALIDATION_ERROR, 'Insufficient balance');
    }

    const generatorNode = await this.nodeRepository.findById(nodeGeneratorId, flowId);
    if (!generatorNode || !generatorNode.isAnyGeneration()) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Generator node not found');
    }

    const edges = await this.edgeRepository.findByTargetNodeId({
      flowId,
      targetNodeId: nodeGeneratorId,
    });
    const inputs = edges.map((e) => e.attrs.sourceNodeId);
    const inputNodes =
      inputs.length > 0
        ? await this.nodeRepository.findNodesByIds({
            flowId,
            nodeIds: inputs,
          })
        : [];

    const { modelType, creditsRequired } = await this.resolveModelType(generatorNode, inputNodes);

    if (account.attrs.balance.attrs.balance < creditsRequired) {
      throw new ApplicationError(
        ErrorCode.VALIDATION_ERROR,
        `Insufficient balance. Required: ${creditsRequired}, Available: ${account.attrs.balance.attrs.balance}`,
      );
    }

    this.setNodeQueued(generatorNode);

    inputNodes.forEach((n) => {
      n.updateAttributes({
        isExecuted: true,
      });
    });

    const allNodes = [
      generatorNode,
      ...inputNodes,
    ];

    await this.transactWrite.execute(async (tx) => {
      for (const node of allNodes) {
        await this.nodeRepository.update(node, tx);
      }
    });

    await this.imageSQSGateway.publish({
      flowId,
      nodeGeneratorId,
      inputs,
      accountId,
      modelType,
    });
  }

  private async resolveModelType(
    generator: NodeEntity,
    inputNodes: NodeEntity[],
  ): Promise<{
    modelType: GenerationSQSGateway.ModelType;
    creditsRequired: number;
  }> {
    const promptNode = inputNodes.find(
      (n) => n.isPrompt() && n.attrs.data.prompt && n.attrs.data.prompt.length >= 3,
    );
    const imageNodes = inputNodes.filter((n) => n.isImage() && n.attrs.data.key);

    if (generator.isGeneration()) {
      if (!promptNode)
        throw new ApplicationError(
          ErrorCode.VALIDATION_ERROR,
          'A prompt with at least 3 characters is required',
        );
      if (imageNodes.length === 0)
        throw new ApplicationError(
          ErrorCode.VALIDATION_ERROR,
          'At least one image is required for editing',
        );
      const { creditsRequired } = await this.creditService.calculateForGenerationNode({
        generatorNodeData: generator.attrs.data,
      });
      return {
        modelType: 'image-edit',
        creditsRequired,
      };
    }

    if (generator.isTextToImage()) {
      if (!promptNode)
        throw new ApplicationError(
          ErrorCode.VALIDATION_ERROR,
          'A prompt with at least 3 characters is required',
        );
      const { creditsRequired } = await this.creditService.calculateForTextToImageNode({
        generatorNodeData: generator.attrs.data,
      });
      return {
        modelType: 'text-to-image',
        creditsRequired,
      };
    }

    if (generator.isUpscale()) {
      if (imageNodes.length === 0)
        throw new ApplicationError(
          ErrorCode.VALIDATION_ERROR,
          'An image is required for upscaling',
        );
      const { creditsRequired } = await this.creditService.calculateForUpscaleNode({
        generatorNodeData: generator.attrs.data,
      });
      return {
        modelType: 'upscale',
        creditsRequired,
      };
    }

    if (generator.isRemoveBg()) {
      if (imageNodes.length === 0)
        throw new ApplicationError(
          ErrorCode.VALIDATION_ERROR,
          'An image is required for background removal',
        );
      const { creditsRequired } = await this.creditService.calculateForRemoveBgNode();
      return {
        modelType: 'remove-bg',
        creditsRequired,
      };
    }

    if (generator.isImageToVideo()) {
      if (imageNodes.length === 0)
        throw new ApplicationError(
          ErrorCode.VALIDATION_ERROR,
          'An image is required for video generation',
        );
      if (imageNodes.length > 2)
        throw new ApplicationError(
          ErrorCode.VALIDATION_ERROR,
          'Maximum 2 images allowed: start frame and optional end frame',
        );
      const { creditsRequired } = await this.creditService.calculateForImageToVideoNode({
        tier: generator.attrs.data.tier,
        duration: generator.attrs.data.duration,
        resolution: generator.attrs.data.resolution,
        generateAudio: generator.attrs.data.generateAudio,
      });
      return {
        modelType: 'image-to-video',
        creditsRequired,
      };
    }

    if (generator.isMotionControl()) {
      if (imageNodes.length === 0)
        throw new ApplicationError(
          ErrorCode.VALIDATION_ERROR,
          'An image is required for motion control',
        );
      const videoNodes = inputNodes.filter((n) => n.isVideo() && n.getVideoKey());
      if (videoNodes.length === 0)
        throw new ApplicationError(
          ErrorCode.VALIDATION_ERROR,
          'A reference video is required for motion control',
        );
      const videoNode = videoNodes[0];
      const videoDuration = videoNode.getVideoDuration();
      if (!videoDuration || videoDuration <= 0)
        throw new ApplicationError(
          ErrorCode.VALIDATION_ERROR,
          'Video duration is unknown, cannot calculate credits',
        );
      if (videoDuration > 30)
        throw new ApplicationError(
          ErrorCode.VALIDATION_ERROR,
          `Video duration (${videoDuration.toFixed(1)}s) exceeds the maximum of 30s`,
        );
      const { creditsRequired } = await this.creditService.calculateForMotionControlNode({
        duration: videoDuration,
        keepOriginalSound: generator.attrs.data.keepOriginalSound,
      });
      return {
        modelType: 'motion-control',
        creditsRequired,
      };
    }

    throw new ApplicationError(ErrorCode.VALIDATION_ERROR, 'Unknown generator node type');
  }

  private setNodeQueued(generator: NodeEntity): void {
    if (generator.isAnyGeneration()) {
      generator.updateAttributes({
        data: {
          ...generator.attrs.data,
          status: GenerationStatusEnum.QUEUED,
        } as any,
        isExecuted: true,
      });
    }
  }
}
