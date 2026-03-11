import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { ForbiddenError } from '@application/errors/application/forbidden.error';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { FlowDynamoRepository } from '@infra/database/dynamo/repositories/flow-dynamo.repository';
import { DeleteFlowUnitOfWork } from '@infra/database/dynamo/uows/delete-flow.uow';
import { FileStorageGateway } from '@infra/gateways/aws/file-storage.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

interface DeleteFlowUseCaseInput {
  flowId: string;
  accountId: string;
}

@Injectable()
export class DeleteFlowUseCase implements IUseCase<DeleteFlowUseCaseInput, void> {
  constructor(
    private readonly flowRepository: FlowDynamoRepository,
    private readonly fileStorage: FileStorageGateway,
    private readonly deleteFlowUOW: DeleteFlowUnitOfWork,
  ) {}

  async execute(params: DeleteFlowUseCaseInput): Promise<void> {
    const flow = await this.flowRepository.findFlowAndNodesAndEdgesById(params.flowId);

    if (!flow) {
      throw new ResourceNotFoundError('Flow not found');
    }

    const isThisFlowMe = flow.attrs.accountId === params.accountId;

    if (!isThisFlowMe) {
      throw new ForbiddenError();
    }

    if (flow.attrs.nodes && flow.attrs.nodes.length > 0) {
      const fileKeys = flow.attrs.nodes
        .filter((node) => 'key' in node.attrs.data && node.attrs.data.key)
        .map((node) => (node.attrs.data as NodeEntity.FileNodeData).key)
        .filter((key) => !!key) as string[];

      if (fileKeys.length > 0) await this.fileStorage.deleteFiles(fileKeys);
    }

    await this.deleteFlowUOW.run({
      flow,
      nodes: flow.attrs.nodes,
      edges: flow.attrs.edges,
    });
  }
}
