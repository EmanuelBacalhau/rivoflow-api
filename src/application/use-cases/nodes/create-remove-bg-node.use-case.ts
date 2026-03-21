import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { GenerationStatusEnum } from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { FlowDrizzleRepository } from '@infra/database/drizzle/repositories/flow-drizzle.repository';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { RemoveBgGatewayAI } from '@infra/gateways/ai/remove-bg-ai.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

type Input = { flowId: string; position: NodeEntity.Position };
type Output = { node: NodeEntity.AllAttributes };

@Injectable()
export class CreateRemoveBgNodeUseCase implements IUseCase<Input, Output> {
  constructor(
    private readonly nodeRepository: NodeDrizzleRepository,
    private readonly flowRepository: FlowDrizzleRepository,
  ) {}

  async execute(params: Input): Promise<Output> {
    const flow = await this.flowRepository.findById(params.flowId);
    if (!flow) throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Flow not found');

    const node = new NodeEntity({
      flowId: params.flowId,
      nodeType: NodeEntity.NodeType.GENERATION_REMOVE_BG,
      position: params.position,
      isExecuted: false,
      data: {
        model: RemoveBgGatewayAI.Model,
        status: GenerationStatusEnum.PENDING,
        attempts: 0,
        outputNodeId: null,
      },
    });

    await this.nodeRepository.save(node);
    return { node: node.attrs };
  }
}
