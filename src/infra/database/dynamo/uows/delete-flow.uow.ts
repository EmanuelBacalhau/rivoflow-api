import { EdgeEntity } from '@application/entities/edge.entity';
import { FlowEntity } from '@application/entities/flow.entity';
import { NodeEntity } from '@application/entities/node.entity';
import { Injectable } from '@kernel/decorators/injectable';
import { EdgeDynamoRepository } from '../repositories/edge-dynamo.repository';
import { FlowDynamoRepository } from '../repositories/flow-dynamo.repository';
import { NodeDynamoRepository } from '../repositories/node-dynamo.repository';
import { UnitOfWork } from './unit-of-work';

@Injectable()
export class DeleteFlowUnitOfWork extends UnitOfWork {
  constructor(
    private readonly flowRepository: FlowDynamoRepository,
    private readonly nodeRepository: NodeDynamoRepository,
    private readonly edgeRepository: EdgeDynamoRepository,
  ) {
    super();
  }

  async run(input: DeleteFlowUnitOfWork.Input): Promise<void> {
    const { flow, nodes, edges } = input;

    this.addPut(this.flowRepository.getDeleteCommandInput(flow.attrs.id));
    nodes?.forEach((node) => {
      this.addPut(
        this.nodeRepository.getDeleteCommandInput({
          flowId: flow.attrs.id,
          nodeId: node.attrs.id,
        }),
      );
    });
    edges?.forEach((edge) => {
      this.addPut(
        this.edgeRepository.getDeleteCommandInput({
          flowId: flow.attrs.id,
          edgeId: edge.attrs.id,
        }),
      );
    });

    await this.commit();
  }
}

export namespace DeleteFlowUnitOfWork {
  export interface Input {
    flow: FlowEntity;
    nodes: NodeEntity[];
    edges: EdgeEntity[];
  }
}
