import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { InvalidNodeTypeError } from '@application/errors/application/invalid-node-type.error';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { CreditCalculationService } from '@application/services/credit-calculation.service';
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
    private readonly creditCalculationService: CreditCalculationService,
  ) {}

  async execute(
    params: CalculateCreditsNodeGeneratorUseCaseInput,
  ): Promise<CalculateCreditsNodeGeneratorUseCaseOutput> {
    const { nodeId, flowId } = params;

    const node = await this.nodeRepository.findById(nodeId, flowId);

    if (!node) {
      throw new ResourceNotFoundError('Node not found');
    }

    if (!NodeEntity.isGenerationData(node.attrs.data)) {
      throw new InvalidNodeTypeError('Node is not a generation image type');
    }

    const nodeData = node.attrs.data;
    const { inputs } = nodeData;

    if (!inputs || inputs.length === 0) {
      return {
        creditsRequired: 0,
      };
    }

    const nodes = await this.nodeRepository.findNodesByIds({
      flowId,
      nodeIds: inputs,
    });

    const { creditsRequired } = await this.creditCalculationService.calculateForGenerationNode({
      generatorNodeData: nodeData,
      inputNodes: nodes,
    });

    return {
      creditsRequired,
    };
  }
}
