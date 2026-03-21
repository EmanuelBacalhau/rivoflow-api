import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { CreditService } from '@application/services/credit.service';
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
    private readonly creditService: CreditService,
  ) {}

  async execute(
    params: CalculateCreditsNodeGeneratorUseCaseInput,
  ): Promise<CalculateCreditsNodeGeneratorUseCaseOutput> {
    const { nodeId, flowId } = params;

    const node = await this.nodeRepository.findById(nodeId, flowId);

    if (!node) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Node not found');
    }

    if (!node.isAnyGeneration()) {
      throw new ApplicationError(ErrorCode.INVALID_NODE_TYPE, 'Node is not a generation type');
    }

    if (node.isGeneration()) {
      const { creditsRequired } = await this.creditService.calculateForGenerationNode({
        generatorNodeData: node.attrs.data,
      });
      return { creditsRequired };
    }

    if (node.isTextToImage()) {
      const { creditsRequired } = await this.creditService.calculateForTextToImageNode();
      return { creditsRequired };
    }

    if (node.isUpscale()) {
      const { creditsRequired } = await this.creditService.calculateForUpscaleNode();
      return { creditsRequired };
    }

    if (node.isRemoveBg()) {
      const { creditsRequired } = await this.creditService.calculateForRemoveBgNode();
      return { creditsRequired };
    }

    if (node.isImageToVideo()) {
      const { creditsRequired } = await this.creditService.calculateForImageToVideoNode({
        tier: node.attrs.data.tier,
        duration: node.attrs.data.duration,
      });
      return { creditsRequired };
    }

    return { creditsRequired: 0 };
  }
}
