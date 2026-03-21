import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import {
  GenerationStatusEnum,
  VideoAspectRatioEnum,
  VideoDurationEnum,
  VideoResolutionEnum,
  VideoTierEnum,
} from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { FlowDrizzleRepository } from '@infra/database/drizzle/repositories/flow-drizzle.repository';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { Injectable } from 'src/kernel/decorators/injectable';

type Input = {
  flowId: string;
  position: NodeEntity.Position;
  tier?: VideoTierEnum;
};
type Output = { node: NodeEntity.AllAttributes };

@Injectable()
export class CreateImageToVideoNodeUseCase implements IUseCase<Input, Output> {
  constructor(
    private readonly nodeRepository: NodeDrizzleRepository,
    private readonly flowRepository: FlowDrizzleRepository,
  ) {}

  async execute(params: Input): Promise<Output> {
    const flow = await this.flowRepository.findById(params.flowId);
    if (!flow) throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Flow not found');

    const tier = params.tier ?? VideoTierEnum.STANDARD;
    const model = tier === VideoTierEnum.STANDARD
      ? 'fal-ai/ltx-2.3/image-to-video'
      : 'fal-ai/kling-video/v3/pro/image-to-video';

    const node = new NodeEntity({
      flowId: params.flowId,
      nodeType: NodeEntity.NodeType.GENERATION_IMAGE_TO_VIDEO,
      position: params.position,
      isExecuted: false,
      data: {
        model,
        status: GenerationStatusEnum.PENDING,
        attempts: 0,
        outputNodeId: null,
        tier,
        duration: VideoDurationEnum.S5,
        resolution: VideoResolutionEnum['1080p'],
        aspectRatio: VideoAspectRatioEnum['16:9'],
        generateAudio: true,
      },
    });

    await this.nodeRepository.save(node);
    return { node: node.attrs };
  }
}
