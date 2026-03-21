import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { FlowDrizzleRepository } from '@infra/database/drizzle/repositories/flow-drizzle.repository';
import { FileStorageGateway } from '@infra/gateways/aws/file-storage.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

interface DeleteFlowUseCaseInput {
  flowId: string;
  accountId: string;
}

@Injectable()
export class DeleteFlowUseCase implements IUseCase<DeleteFlowUseCaseInput, void> {
  constructor(
    private readonly flowRepository: FlowDrizzleRepository,
    private readonly fileStorage: FileStorageGateway,
  ) {}

  async execute(params: DeleteFlowUseCaseInput): Promise<void> {
    const flow = await this.flowRepository.findFlowAndNodesAndEdgesById(params.flowId);

    if (!flow) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Flow not found');
    }

    if (flow.attrs.accountId !== params.accountId) {
      throw new ApplicationError(ErrorCode.FORBIDDEN);
    }

    const fileKeys: string[] = [];
    for (const node of flow.attrs.nodes) {
      if (node.isImage() && node.attrs.data.key) {
        fileKeys.push(node.attrs.data.key);
      }
    }

    if (fileKeys.length > 0) {
      await this.fileStorage.deleteFiles(fileKeys);
    }

    // ON DELETE CASCADE removes nodes and edges automatically
    await this.flowRepository.delete(flow.attrs.id);
  }
}
