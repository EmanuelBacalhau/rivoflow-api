import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { GenerationStatusEnum } from '@application/entities/node-enums';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { ValidationError } from '@application/errors/application/validation.error';
import { CreditCalculationService } from '@application/services/credit-calculation.service';
import { AccountDynamoRepository } from '@infra/database/dynamo/repositories/account-dynamo.repository';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { CreateImageAIUnitOfWork } from '@infra/database/dynamo/uows/create-image-ai.uow';
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
    private readonly nodeRepository: NodeDynamoRepository,
    private readonly createImageAIUOW: CreateImageAIUnitOfWork,
    private readonly accountRepository: AccountDynamoRepository,
    private readonly creditCalculationService: CreditCalculationService,
  ) {}

  async execute(params: CreateImageAIUseCaseInput): Promise<void> {
    const { flowId, nodeGeneratorId, accountId } = params;

    const account = await this.accountRepository.findByIdWithBalance(accountId);

    if (!account) {
      throw new ResourceNotFoundError('Account not found');
    }

    if (account.attrs.balance.attrs.balance <= 0) {
      throw new ValidationError('Insufficient balance to generate an image');
    }

    const generatorNode = await this.nodeRepository.findById(nodeGeneratorId, flowId);

    if (!generatorNode) {
      throw new ResourceNotFoundError('Node not found');
    }

    if (generatorNode.attrs.data.type !== NodeEntity.NodeType.GENERATION_IMAGE) {
      throw new ResourceNotFoundError('Node is not a generation node');
    }

    const genData = generatorNode.attrs.data;
    const inputs = genData.inputs || [];

    if (!inputs.length) {
      throw new ValidationError('No inputs connected to generate an image');
    }

    const inputNodes = await this.nodeRepository.findNodesByIds({
      flowId,
      nodeIds: inputs,
    });

    const hasValidInput = inputNodes.some((n) => {
      if (n.attrs.data.type === NodeEntity.NodeType.PROMPT) {
        return !!n.attrs.data.prompt;
      }
      if (
        n.attrs.data.type === NodeEntity.NodeType.IMAGE ||
        n.attrs.data.type === NodeEntity.NodeType.RESULT_IMAGE
      ) {
        return !!n.attrs.data.key;
      }
      return false;
    });

    if (!hasValidInput) {
      throw new ValidationError('Connected nodes have no valid content to generate an image');
    }

    const { creditsRequired } = await this.creditCalculationService.calculateForGenerationNode({
      generatorNodeData: genData,
      inputNodes,
    });

    if (account.attrs.balance.attrs.balance < creditsRequired) {
      throw new ValidationError(
        `Insufficient balance to generate an image. Required: ${creditsRequired}, Available: ${account.attrs.balance.attrs.balance}`,
      );
    }

    const totalTokens = inputNodes.reduce((acc, n) => acc + (n.attrs.data.totalTokens || 0), 0);

    generatorNode.updateAttributes({
      data: {
        ...genData,
        status: GenerationStatusEnum.QUEUED,
        totalTokens,
      },
      isExecuted: true,
    });

    inputNodes.forEach((n) => {
      n.updateAttributes({
        isExecuted: true,
      });
    });

    await Promise.all([
      this.createImageAIUOW.run({
        nodes: [
          generatorNode,
          ...inputNodes,
        ],
      }),
      this.imageSQSGateway.publish({
        flowId,
        nodeGeneratorId,
        inputs,
        accountId,
      }),
    ]);
  }
}
