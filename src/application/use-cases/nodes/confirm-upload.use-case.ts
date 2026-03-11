import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { InvalidNodeTypeError } from '@application/errors/application/invalid-node-type.error';
import { NoFileUploadedError } from '@application/errors/application/no-file-uploaded.error';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { Injectable } from 'src/kernel/decorators/injectable';
import { GeminiPricing } from 'src/shared/config/gemini-pricing';

export type ConfirmUploadUseCaseInput = {
  nodeId: string;
  flowId: string;
};

@Injectable()
export class ConfirmUploadUseCase implements IUseCase<ConfirmUploadUseCaseInput, void> {
  constructor(private readonly nodeRepository: NodeDynamoRepository) {}

  async execute(params: ConfirmUploadUseCaseInput): Promise<void> {
    const { nodeId, flowId } = params;

    const node = await this.nodeRepository.findById(nodeId, flowId);

    if (!node) {
      throw new ResourceNotFoundError('Node not found');
    }

    if (node.attrs.data.type !== NodeEntity.NodeType.IMAGE) {
      throw new InvalidNodeTypeError('Node is not an image type');
    }

    const nodeData = node.attrs.data as NodeEntity.FileNodeData;

    if (!nodeData.key) {
      throw new NoFileUploadedError('No file uploaded for this node');
    }

    const totalTokens = GeminiPricing.inputImageTokens;

    node.updateAttributes({
      data: {
        type: NodeEntity.NodeType.IMAGE,
        key: nodeData.key,
        inputType: nodeData.inputType,
        totalTokens,
      },
    });

    await this.nodeRepository.update(node);
  }
}
