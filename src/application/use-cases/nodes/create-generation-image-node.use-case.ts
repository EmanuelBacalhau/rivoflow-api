import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { AspectRatioEnum, GenerationStatusEnum, QualityEnum } from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { FlowDrizzleRepository } from '@infra/database/drizzle/repositories/flow-drizzle.repository';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { Injectable } from 'src/kernel/decorators/injectable';

const DEFAULT_AI_MODEL = 'gemini-3-pro-image-preview';

type CreateGenerationImageNodeUseCaseInput = {
  flowId: string;
  position: NodeEntity.Position;
};

type CreateGenerationImageNodeUseCaseOutput = {
  node: NodeEntity.AllAttributes;
};

@Injectable()
export class CreateGenerationImageNodeUseCase
  implements IUseCase<CreateGenerationImageNodeUseCaseInput, CreateGenerationImageNodeUseCaseOutput>
{
  constructor(
    private readonly nodeRepository: NodeDrizzleRepository,
    private readonly flowRepository: FlowDrizzleRepository,
  ) {}

  async execute(
    params: CreateGenerationImageNodeUseCaseInput,
  ): Promise<CreateGenerationImageNodeUseCaseOutput> {
    const flow = await this.flowRepository.findById(params.flowId);

    if (!flow) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND,'Flow not found');
    }

    const node = new NodeEntity({
      flowId: params.flowId,
      position: params.position,
      isExecuted: false,
      totalTokens: 0,
      data: {
        type: NodeEntity.NodeType.GENERATION_IMAGE,
        model: DEFAULT_AI_MODEL,
        inputs: [],
        parameters: {
          aspectRatio: AspectRatioEnum['1:1'],
          quality: QualityEnum['1K'],
        },
        status: GenerationStatusEnum.PENDING,
        attempts: 0,
        outputNodeId: null,
      },
    });

    await this.nodeRepository.save(node);

    return { node: node.attrs };
  }
}
