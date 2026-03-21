import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { FileStorageGateway } from '@infra/gateways/aws/file-storage.gateway';
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
    private readonly nodeRepository: NodeDrizzleRepository,
    private readonly fileStorageGateway: FileStorageGateway,
  ) {}

  async execute(params: DeleteNodeUseCaseInput): Promise<DeleteNodeUseCaseOutput> {
    const { flowId, nodeId } = params;

    const node = await this.nodeRepository.findById(nodeId, flowId);

    if (!node) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND,'Node not found');
    }

    if ('key' in node.attrs.data && node.attrs.data.key) {
      await this.fileStorageGateway.deleteFile(node.attrs.data.key);
    }

    await this.nodeRepository.delete({
      flowId,
      nodeId,
    });
  }
}
