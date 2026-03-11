import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { InvalidNodeTypeError } from '@application/errors/application/invalid-node-type.error';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { NodeStrategyFactory } from '@application/factories/node-strategy.factory';
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
    private readonly nodeStrategyFactory: NodeStrategyFactory,
  ) {}

  async execute(
    params: CalculateCreditsNodeGeneratorUseCaseInput,
  ): Promise<CalculateCreditsNodeGeneratorUseCaseOutput> {
    const { nodeId, flowId } = params;

    const node = await this.nodeRepository.findById(nodeId, flowId);

    if (!node) {
      throw new ResourceNotFoundError('Node not found');
    }

    if (node.attrs.data.type !== NodeEntity.NodeType.GENERATION_IMAGE) {
      throw new InvalidNodeTypeError('Node is not a generation image type');
    }

    const { inputs } = node.attrs.data;

    if (!inputs || inputs.length === 0) {
      return {
        creditsRequired: 0,
      };
    }

    const nodes = await this.nodeRepository.findNodesByIds({
      flowId,
      nodeIds: inputs,
    });

    const strategy = this.nodeStrategyFactory.getStrategy(node.attrs.data.type);

    let creditsRequired = 0;
    if (strategy.calculateCredits) {
      creditsRequired = await strategy.calculateCredits(node, nodes);
    }

    return {
      creditsRequired,
    };
  }
}
