import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { CreditService } from '@application/services/credit.service';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
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
    private readonly nodeRepository: NodeDynamoRepository,
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

    if (node.attrs.data.type !== NodeEntity.NodeType.GENERATION_IMAGE) {
      throw new ApplicationError(ErrorCode.INVALID_NODE_TYPE,'Node is not a generation image type');
    }

    const { inputs } = node.attrs.data;

    if (!inputs || inputs.length === 0) {
      return { creditsRequired: 0 };
    }

    const inputNodes = await this.nodeRepository.findNodesByIds({ flowId, nodeIds: inputs });

    const { creditsRequired } = await this.creditService.calculateForGenerationNode({
      generatorNodeData: node.attrs.data,
      inputNodes,
    });

    return { creditsRequired };
  }
}
