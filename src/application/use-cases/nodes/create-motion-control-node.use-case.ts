import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { CharacterOrientationEnum, GenerationStatusEnum } from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { FlowDrizzleRepository } from '@infra/database/drizzle/repositories/flow-drizzle.repository';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { MotionControlGatewayAI } from '@infra/gateways/ai/motion-control-ai.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

type Input = {
  flowId: string;
  position: NodeEntity.Position;
};
type Output = {
  node: NodeEntity.AllAttributes;
};

@Injectable()
export class CreateMotionControlNodeUseCase implements IUseCase<Input, Output> {
  constructor(
    private readonly nodeRepository: NodeDrizzleRepository,
    private readonly flowRepository: FlowDrizzleRepository,
  ) {}

  async execute(params: Input): Promise<Output> {
    const flow = await this.flowRepository.findById(params.flowId);
    if (!flow) throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Flow not found');

    const node = new NodeEntity({
      flowId: params.flowId,
      nodeType: NodeEntity.NodeType.GENERATION_MOTION_CONTROL,
      position: params.position,
      isExecuted: false,
      data: {
        model: MotionControlGatewayAI.Model,
        status: GenerationStatusEnum.PENDING,
        attempts: 0,
        outputNodeId: null,
        characterOrientation: CharacterOrientationEnum.VIDEO,
        keepOriginalSound: false,
      },
    });

    await this.nodeRepository.save(node);
    return {
      node: node.attrs,
    };
  }
}
