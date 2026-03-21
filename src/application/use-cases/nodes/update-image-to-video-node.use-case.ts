import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import {
  VideoAspectRatioEnum,
  VideoDurationEnum,
  VideoResolutionEnum,
  VideoTierEnum,
} from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { DrizzleTransaction } from '@infra/database/drizzle/drizzle-transaction';
import { FlowDrizzleRepository } from '@infra/database/drizzle/repositories/flow-drizzle.repository';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { Injectable } from 'src/kernel/decorators/injectable';

type Input = {
  nodeId: string;
  flowId: string;
  tier?: VideoTierEnum;
  duration?: VideoDurationEnum;
  resolution?: VideoResolutionEnum;
  aspectRatio?: VideoAspectRatioEnum;
  generateAudio?: boolean;
};

@Injectable()
export class UpdateImageToVideoNodeUseCase implements IUseCase<Input, void> {
  constructor(
    private readonly nodeRepository: NodeDrizzleRepository,
    private readonly flowRepository: FlowDrizzleRepository,
    private readonly transactWrite: DrizzleTransaction,
  ) {}

  async execute(params: Input): Promise<void> {
    const { nodeId, flowId } = params;

    const flow = await this.flowRepository.findById(flowId);
    if (!flow) throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Flow not found');

    const node = await this.nodeRepository.findById(nodeId, flowId);
    if (!node) throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Node not found');
    if (!node.isImageToVideo()) throw new ApplicationError(ErrorCode.INVALID_NODE_TYPE, 'Node is not an image-to-video type');

    const currentData = node.attrs.data;
    const newTier = params.tier ?? currentData.tier;
    const model = newTier === VideoTierEnum.STANDARD
      ? 'fal-ai/ltx-2.3/image-to-video'
      : 'fal-ai/kling-video/v3/pro/image-to-video';

    node.updateAttributes({
      data: {
        ...currentData,
        model,
        tier: newTier,
        duration: params.duration ?? currentData.duration,
        resolution: params.resolution ?? currentData.resolution,
        aspectRatio: params.aspectRatio ?? currentData.aspectRatio,
        generateAudio: params.generateAudio ?? currentData.generateAudio,
      },
    });

    flow.updateAttributes({ updatedAt: new Date() });

    await this.transactWrite.execute(async (tx) => {
      await this.flowRepository.update(flow, tx);
      await this.nodeRepository.update(node, tx);
    });
  }
}
