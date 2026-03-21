import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { FlowDrizzleRepository } from '@infra/database/drizzle/repositories/flow-drizzle.repository';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { DrizzleTransaction } from '@infra/database/drizzle/drizzle-transaction';
import { FileStorageGateway } from '@infra/gateways/aws/file-storage.gateway';
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
    private readonly nodeRepository: NodeDrizzleRepository,
    private readonly flowRepository: FlowDrizzleRepository,
    private readonly transactWrite: DrizzleTransaction,
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
      data: {
        inputType: 'IMAGE',
        key: fileKey,
      },
    });

    flow.updateAttributes({
      updatedAt: new Date(),
    });

    await this.transactWrite.execute(async (tx) => {
      await this.flowRepository.update(flow, tx);
      await this.nodeRepository.update(node, tx);
    });

    const imageUrl = this.fileStorageGateway.generateCdnUrl(fileKey);

    return {
      uploadSignature,
      key: fileKey,
      imageUrl,
    };
  }
}
