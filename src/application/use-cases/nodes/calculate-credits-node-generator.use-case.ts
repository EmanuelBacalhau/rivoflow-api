import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { CreditService } from '@application/services/credit.service';
import { EdgeDrizzleRepository } from '@infra/database/drizzle/repositories/edge-drizzle.repository';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { Injectable } from 'src/kernel/decorators/injectable';

type CalculateCreditsNodeGeneratorUseCaseInput = {
  nodeId: string;
  flowId: string;
};

type CalculateCreditsNodeGeneratorUseCaseOutput = {
  creditsRequired: number;
};

@Injectable()
export class CalculateCreditsNodeGeneratorUseCase
  implements
    IUseCase<CalculateCreditsNodeGeneratorUseCaseInput, CalculateCreditsNodeGeneratorUseCaseOutput>
{
  constructor(
    private readonly nodeRepository: NodeDrizzleRepository,
    private readonly edgeRepository: EdgeDrizzleRepository,
    private readonly creditService: CreditService,
  ) {}

  async execute(
    params: CalculateCreditsNodeGeneratorUseCaseInput,
  ): Promise<CalculateCreditsNodeGeneratorUseCaseOutput> {
    const { nodeId, flowId } = params;

    const node = await this.nodeRepository.findById(nodeId, flowId);

    if (!node) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND,'Node not found');
    }

    if (!node.isGeneration()) {
      throw new ApplicationError(ErrorCode.INVALID_NODE_TYPE,'Node is not a generation image type');
    }

    const edges = await this.edgeRepository.findByTargetNodeId({ flowId, targetNodeId: nodeId });
    const inputNodeIds = edges.map((e) => e.attrs.sourceNodeId);

    if (inputNodeIds.length === 0) {
      return { creditsRequired: 0 };
    }

    const inputNodes = await this.nodeRepository.findNodesByIds({ flowId, nodeIds: inputNodeIds });

    const { creditsRequired } = await this.creditService.calculateForGenerationNode({
      generatorNodeData: node.attrs.data,
      inputNodes,
    });

    return { creditsRequired };
  }
}
