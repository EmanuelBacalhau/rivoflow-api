import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { NodeEntity } from '@application/entities/node.entity';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { NodeDynamoRepository } from '@infra/database/dynamo/repositories/node-dynamo.repository';
import { Injectable } from 'src/kernel/decorators/injectable';

export type UpdateNodeUseCaseInput = {
  flowId: string;
  nodeId: string;
  nodeType: NodeEntity.NodeType;
  data?: NodeEntity.NodeData;
  position?: NodeEntity.Position;
};

@Injectable()
export class UpdateNodeUseCase implements IUseCase<UpdateNodeUseCaseInput, void> {
  constructor(private readonly nodeRepository: NodeDynamoRepository) {}

  async execute(params: UpdateNodeUseCaseInput): Promise<void> {
    const { nodeId, data, position, flowId, nodeType } = params;
    const node = await this.nodeRepository.findById(nodeId, flowId);

    if (!node) {
      throw new ResourceNotFoundError('Node not found');
    }

    if (node.attrs.data.type !== nodeType) {
      // TODO: Handle type mismatch more gracefully, possibly with a custom error
      throw new Error(`Node type mismatch: expected ${node.attrs.data.type}, got ${nodeType}`);
    }

    node?.updateAttributes({
      data: data
        ? {
            ...node.attrs.data,
            ...data,
          }
        : node.attrs.data,
      position: position || node.attrs.position,
    });

    await this.nodeRepository.update(node);
  }
}
