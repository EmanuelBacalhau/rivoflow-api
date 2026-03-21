import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { FlowDynamoRepository } from '@infra/database/dynamo/repositories/flow-dynamo.repository';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { TransactWrite } from '@infra/database/dynamo/transact-write';
import { FileStorageGateway } from '@infra/gateways/aws/file-storage.gateway';
import { GeminiPricing } from '@shared/config/gemini-pricing';
import { Injectable } from 'src/kernel/decorators/injectable';

type UploadFileUseCaseInput = {
  flowId: string;
  nodeId: string;
  accountId: string;
  file: {
    type: string;
    size: number;
  };
};

type UploadFileUseCaseOutput = {
  uploadSignature: string;
  key: string;
  imageUrl: string;
};

@Injectable()
export class UploadFileUseCase
  implements IUseCase<UploadFileUseCaseInput, UploadFileUseCaseOutput>
{
  constructor(
    private readonly fileStorageGateway: FileStorageGateway,
    private readonly nodeRepository: NodeDynamoRepository,
    private readonly flowRepository: FlowDynamoRepository,
  ) {}

  async execute(params: UploadFileUseCaseInput): Promise<UploadFileUseCaseOutput> {
    const { flowId, nodeId, accountId, file } = params;

    const flow = await this.flowRepository.findById(flowId);

    if (!flow) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Flow not found');
    }

    const node = await this.nodeRepository.findById(nodeId, flowId);

    if (!node) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Node not found');
    }

    const fileKey = this.fileStorageGateway.generateKeyFile({
      extension: file.type.split('/')[1],
      accountId,
      flowId,
    });

    const { uploadSignature } = await this.fileStorageGateway.createPresignedPost({
      file: {
        key: fileKey,
        type: file.type,
        size: file.size,
      },
    });

    node.updateAttributes({
      totalTokens: GeminiPricing.inputImageTokens,
      data: {
        ...node.attrs.data,
        inputType: 'IMAGE',
        key: fileKey,
      } as NodeEntity.NodeData,
    });

    flow.updateAttributes({
      updatedAt: new Date(),
    });

    await new TransactWrite()
      .addUpdate(this.flowRepository.getUpdateCommandInput(flow))
      .addUpdate(this.nodeRepository.getUpdateCommandInput(node))
      .commit();

    const imageUrl = this.fileStorageGateway.generateCdnUrl(fileKey);

    return {
      uploadSignature,
      key: fileKey,
      imageUrl,
    };
  }
}
