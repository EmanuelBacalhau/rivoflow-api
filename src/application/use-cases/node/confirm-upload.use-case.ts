import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { GoogleAIGateway } from '@infra/gateways/ai/google-ai.gateway';
import { FileStorageGateway } from '@infra/gateways/aws/file-storage.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

export type ConfirmUploadUseCaseInput = {
  nodeId: string;
  flowId: string;
};

@Injectable()
export class ConfirmUploadUseCase implements IUseCase<ConfirmUploadUseCaseInput, void> {
  constructor(
    private readonly nodeRepository: NodeDynamoRepository,
    private readonly fileStorageGateway: FileStorageGateway,
    private readonly googleAIGateway: GoogleAIGateway,
  ) {}

  async execute(params: ConfirmUploadUseCaseInput): Promise<void> {
    const { nodeId, flowId } = params;

    const node = await this.nodeRepository.findById(nodeId, flowId);

    if (!node) {
      throw new ResourceNotFoundError('Node not found');
    }

    if (node.attrs.data.type !== NodeEntity.NodeType.IMAGE) {
      throw new Error('Node is not an image type');
    }

    const nodeData = node.attrs.data as NodeEntity.NodeDataFile;

    if (!nodeData.key) {
      throw new Error('No file uploaded for this node');
    }

    const imageBuffer = await this.fileStorageGateway.getFile(nodeData.key);
    const ext = nodeData.key.split('.').pop()?.toLowerCase();
    const mimeType = `image/${ext}`;

    const totalTokens = await this.googleAIGateway.countTokensForImage(imageBuffer, mimeType);

    node.updateAttributes({
      data: {
        type: NodeEntity.NodeType.IMAGE,
        key: nodeData.key,
        totalTokens,
      },
    });

    await this.nodeRepository.update(node);
  }
}
