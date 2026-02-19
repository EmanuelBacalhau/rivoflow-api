import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { FileStorageGateway } from '@infra/gateways/aws/file-storage.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

type UploadFileUseCaseInput = {
  flowId: string;
  nodeId: string;
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
  ) {}

  async execute(params: UploadFileUseCaseInput): Promise<UploadFileUseCaseOutput> {
    const { flowId, nodeId, file } = params;

    const node = await this.nodeRepository.findById(nodeId, flowId);

    if (!node) {
      throw new ResourceNotFoundError('Node not found');
    }

    const fileKey = this.fileStorageGateway.generateKeyFile({
      extension: file.type.split('/')[1],
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
      } as NodeEntity.NodeDataFile,
    });

    await this.nodeRepository.update(node);

    const imageUrl = await this.fileStorageGateway.generateGetPresignedUrl(fileKey);

    return {
      uploadSignature,
      key: fileKey,
      imageUrl,
    };
  }
}
