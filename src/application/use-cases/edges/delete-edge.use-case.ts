import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { EdgeDrizzleRepository } from '@infra/database/drizzle/repositories/edge-drizzle.repository';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { Injectable } from 'src/kernel/decorators/injectable';

type DeleteEdgeUseCaseInput = {
  flowId: string;
  edgeId: string;
};

@Injectable()
export class DeleteEdgeUseCase implements IUseCase<DeleteEdgeUseCaseInput, void> {
  constructor(
    private readonly edgeRepository: EdgeDrizzleRepository,
    private readonly nodeRepository: NodeDrizzleRepository,
  ) {}

  async execute(params: DeleteEdgeUseCaseInput): Promise<void> {
    const edge = await this.edgeRepository.findById({
      flowId: params.flowId,
      edgeId: params.edgeId,
    });

    if (!edge) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Edge not found');
    }

    const node = await this.nodeRepository.findById(edge.attrs.targetNodeId, params.flowId);

    await this.edgeRepository.delete(params);

    if (node?.isGeneration()) {
      const updatedInputs = (node.attrs.data.inputs || []).filter(
        (input: string) => input !== edge.attrs.sourceNodeId,
      );

      node.updateAttributes({
        data: {
          ...node.attrs.data,
          inputs: updatedInputs,
        },
      });

      await this.nodeRepository.update(node);
    }
  }
}
