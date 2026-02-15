import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { FileStorageGateway } from '@infra/gateways/aws/FileStorageGateway';
import { Injectable } from 'src/kernel/decorators/injectable';

type DeleteNodeUseCaseInput = {
  flowId: string;
  nodeId: string;
};

type DeleteNodeUseCaseOutput = void;

@Injectable()
export class DeleteNodeUseCase
  implements IUseCase<DeleteNodeUseCaseInput, DeleteNodeUseCaseOutput>
{
  constructor(
    private readonly nodeRepository: NodeDynamoRepository,
    private readonly fileStorageGateway: FileStorageGateway,
  ) {}

  async execute(params: DeleteNodeUseCaseInput): Promise<DeleteNodeUseCaseOutput> {
    const { flowId, nodeId } = params;

    const node = await this.nodeRepository.findById(nodeId, flowId);

    if (!node) {
      throw new ResourceNotFoundError('Node not found');
    }

    if (node.attrs.data.type === NodeEntity.NodeType.IMAGE && node.attrs.data.key) {
      await this.fileStorageGateway.deleteFile(node.attrs.data.key);
    }

    await this.nodeRepository.delete(flowId, nodeId);
  }
}
