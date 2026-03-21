import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { EdgeDynamoRepository } from '@infra/database/dynamo/repositories/edge-dynamo.repository';
import { FlowDynamoRepository } from '@infra/database/dynamo/repositories/flow-dynamo.repository';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { TransactOperation, TransactWrite } from '@infra/database/dynamo/transact-write';
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
    private readonly nodeRepository: NodeDynamoRepository,
    private readonly edgeRepository: EdgeDynamoRepository,
    private readonly fileStorage: FileStorageGateway,
    private readonly transactWrite: TransactWrite,
  ) {}

  async execute(params: DeleteFlowUseCaseInput): Promise<void> {
    const flow = await this.flowRepository.findFlowAndNodesAndEdgesById(params.flowId);

    if (!flow) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Flow not found');
    }

    const isThisFlowMe = flow.attrs.accountId === params.accountId;

    if (!isThisFlowMe) {
      throw new ApplicationError(ErrorCode.FORBIDDEN);
    }

    if (flow.attrs.nodes && flow.attrs.nodes.length > 0) {
      const fileKeys = flow.attrs.nodes
        .filter((node) => 'key' in node.attrs.data && node.attrs.data.key)
        .map((node) => (node.attrs.data as NodeEntity.FileNodeData).key)
        .filter((key) => !!key) as string[];

      if (fileKeys.length > 0) await this.fileStorage.deleteFiles(fileKeys);
    }

    const operations: TransactOperation[] = [
      { delete: this.flowRepository.getDeleteCommandInput(flow.attrs.id) },
      ...flow.attrs.nodes.map((node) => ({
        delete: this.nodeRepository.getDeleteCommandInput({
          flowId: flow.attrs.id,
          nodeId: node.attrs.id,
        }),
      })),
      ...flow.attrs.edges.map((edge) => ({
        delete: this.edgeRepository.getDeleteCommandInput({
          flowId: flow.attrs.id,
          edgeId: edge.attrs.id,
        }),
      })),
    ];

    await this.transactWrite.execute(operations);
  }
}
