import { FlowEntity } from '@application/entities/flow.entity';
import { NodeEntity } from '@application/entities/node.entity';
import { Injectable } from '@kernel/decorators/injectable';
import { FlowDynamoRepository } from '../repositories/flow-dynamo.repository';
import { NodeDynamoRepository } from '../repositories/node-dynamo.repository';
import { UnitOfWork } from './unit-of-work';

@Injectable()
export class UpdateNodeUnitOfWork extends UnitOfWork {
  constructor(
    private readonly flowRepository: FlowDynamoRepository,
    private readonly nodeRepository: NodeDynamoRepository,
  ) {
    super();
  }

  async run(input: UpdateNodeUnitOfWork.Input): Promise<void> {
    const { flow, node } = input;

    this.addUpdate(this.flowRepository.getUpdateCommandInput(flow));
    this.addUpdate(this.nodeRepository.getUpdateCommandInput(node));

    await this.commit();
  }
}

export namespace UpdateNodeUnitOfWork {
  export interface Input {
    flow: FlowEntity;
    node: NodeEntity;
  }
}
