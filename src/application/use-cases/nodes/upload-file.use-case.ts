import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { FlowDynamoRepository } from '@infra/database/dynamo/repositories/flow-dynamo.repository';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { UpdateNodeUnitOfWork } from '@infra/database/dynamo/uows/update-node.uow';
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
    private readonly updateNodeUOW: UpdateNodeUnitOfWork,
  ) {}

  async execute(params: UploadFileUseCaseInput): Promise<UploadFileUseCaseOutput> {
    const { flowId, nodeId, accountId, file } = params;

    const flow = await this.flowRepository.findById(flowId);

    if (!flow) {
      throw new ResourceNotFoundError('Flow not found');
    }

    const node = await this.nodeRepository.findById(nodeId, flowId);

    if (!node) {
      throw new ResourceNotFoundError('Node not found');
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
      data: {
        ...node.attrs.data,
        inputType: 'IMAGE',
        key: fileKey,
        totalTokens: GeminiPricing.inputImageTokens,
      } as NodeEntity.NodeDataFile,
    });

    flow.updateAttributes({
      updatedAt: new Date(),
    });

    await this.updateNodeUOW.run({
      flow,
      node,
    });

    const imageUrl = this.fileStorageGateway.generateCdnUrl(fileKey);

    return {
      uploadSignature,
      key: fileKey,
      imageUrl,
    };
  }
}
