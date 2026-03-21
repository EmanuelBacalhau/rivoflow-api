import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { GenerationStatusEnum } from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { CreditService } from '@application/services/credit.service';
import { AccountDrizzleRepository } from '@infra/database/drizzle/repositories/account-drizzle.repository';
import { EdgeDrizzleRepository } from '@infra/database/drizzle/repositories/edge-drizzle.repository';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { DrizzleTransaction } from '@infra/database/drizzle/drizzle-transaction';
import { ImageSQSGateway } from '@infra/gateways/aws/image-sqs.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

interface CreateImageAIUseCaseInput {
  flowId: string;
  nodeGeneratorId: string;
  accountId: string;
}

@Injectable()
export class CreateImageAIUseCase implements IUseCase<CreateImageAIUseCaseInput, void> {
  constructor(
    private readonly imageSQSGateway: ImageSQSGateway,
    private readonly nodeRepository: NodeDrizzleRepository,
    private readonly edgeRepository: EdgeDrizzleRepository,
    private readonly accountRepository: AccountDrizzleRepository,
    private readonly creditService: CreditService,
    private readonly transactWrite: DrizzleTransaction,
  ) {}

  async execute(params: CreateImageAIUseCaseInput): Promise<void> {
    const { flowId, nodeGeneratorId, accountId } = params;

    const account = await this.accountRepository.findByIdWithBalance(accountId);

    if (!account) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Account not found');
    }

    if (account.attrs.balance.attrs.balance <= 0) {
      throw new ApplicationError(ErrorCode.VALIDATION_ERROR, 'Insufficient balance to generate an image');
    }

    const generatorNode = await this.nodeRepository.findById(nodeGeneratorId, flowId);

    if (!generatorNode || !generatorNode.isGeneration()) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Generator node not found');
    }

    const edges = await this.edgeRepository.findByTargetNodeId({ flowId, targetNodeId: nodeGeneratorId });
    const inputs = edges.map((e) => e.attrs.sourceNodeId);

    if (!inputs.length) {
      throw new ApplicationError(ErrorCode.VALIDATION_ERROR, 'No inputs connected to generate an image');
    }

    const inputNodes = await this.nodeRepository.findNodesByIds({ flowId, nodeIds: inputs });

    const hasValidInput = inputNodes.some(
      (n) => (n.isPrompt() && n.attrs.data.prompt) || (n.isImage() && n.attrs.data.key),
    );

    if (!hasValidInput) {
      throw new ApplicationError(ErrorCode.VALIDATION_ERROR, 'Connected nodes have no valid content to generate an image');
    }

    const genData = generatorNode.attrs.data;

    const { creditsRequired } = await this.creditService.calculateForGenerationNode({
      generatorNodeData: genData,
      inputNodes,
    });

    if (account.attrs.balance.attrs.balance < creditsRequired) {
      throw new ApplicationError(ErrorCode.VALIDATION_ERROR,
        `Insufficient balance. Required: ${creditsRequired}, Available: ${account.attrs.balance.attrs.balance}`,
      );
    }

    const totalTokens = inputNodes.reduce((acc, n) => acc + (n.attrs.totalTokens || 0), 0);

    generatorNode.updateAttributes({
      totalTokens,
      data: { ...genData, status: GenerationStatusEnum.QUEUED },
      isExecuted: true,
    });

    inputNodes.forEach((n) => {
      n.updateAttributes({ isExecuted: true });
    });

    const allNodes = [generatorNode, ...inputNodes];

    await Promise.all([
      this.transactWrite.execute(async (tx) => {
        for (const node of allNodes) {
          await this.nodeRepository.update(node, tx);
        }
      }),
      this.imageSQSGateway.publish({ flowId, nodeGeneratorId, inputs, accountId }),
    ]);
  }
}
