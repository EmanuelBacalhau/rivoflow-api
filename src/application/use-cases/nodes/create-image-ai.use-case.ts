import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { GenerationStatusEnum } from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { CreditService } from '@application/services/credit.service';
import { AccountDynamoRepository } from '@infra/database/dynamo/repositories/account-dynamo.repository';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { TransactWrite } from '@infra/database/dynamo/transact-write';
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
    private readonly accountRepository: AccountDynamoRepository,
    private readonly creditService: CreditService,
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

    if (!generatorNode) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Node not found');
    }

    if (generatorNode.attrs.data.type !== NodeEntity.NodeType.GENERATION_IMAGE) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Node is not a generation node');
    }

    const genData = generatorNode.attrs.data;
    const inputs = genData.inputs || [];

    if (!inputs.length) {
      throw new ApplicationError(ErrorCode.VALIDATION_ERROR, 'No inputs connected to generate an image');
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
      throw new ApplicationError(ErrorCode.VALIDATION_ERROR, 'Connected nodes have no valid content to generate an image');
    }

    const { creditsRequired } = await this.creditService.calculateForGenerationNode({
      generatorNodeData: genData,
      inputNodes,
    });

    if (account.attrs.balance.attrs.balance < creditsRequired) {
      throw new ApplicationError(ErrorCode.VALIDATION_ERROR,
        `Insufficient balance to generate an image. Required: ${creditsRequired}, Available: ${account.attrs.balance.attrs.balance}`,
      );
    }

    const totalTokens = inputNodes.reduce((acc, n) => acc + (n.attrs.totalTokens || 0), 0);

    generatorNode.updateAttributes({
      totalTokens,
      data: {
        ...genData,
        status: GenerationStatusEnum.QUEUED,
      },
      isExecuted: true,
    });

    inputNodes.forEach((n) => {
      n.updateAttributes({
        isExecuted: true,
      });
    });

    const transaction = new TransactWrite();
    [generatorNode, ...inputNodes].forEach((node) => {
      transaction.addUpdate(this.nodeRepository.getUpdateCommandInput(node));
    });

    await Promise.all([
      transaction.commit(),
      this.imageSQSGateway.publish({
        flowId,
        nodeGeneratorId,
        inputs,
        accountId,
      }),
    ]);
  }
}
