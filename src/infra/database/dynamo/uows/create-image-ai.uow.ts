import { NodeEntity } from '@application/entities/node.entity';
import { Injectable } from '@kernel/decorators/injectable';
import { NodeDynamoRepository } from '../repositories/node-dynamo.repository';
import { UnitOfWork } from './unit-of-work';

@Injectable()
export class CreateImageAIUnitOfWork extends UnitOfWork {
  constructor(private readonly nodeRepository: NodeDynamoRepository) {
    super();
  }

  async run(input: CreateImageAIUnitOfWork.Input): Promise<void> {
    const { nodes } = input;

    nodes.forEach((node) => {
      this.addUpdate(this.nodeRepository.getUpdateCommandInput(node));
    });

    await this.commit();
  }
}

export namespace CreateImageAIUnitOfWork {
  export interface Input {
    nodes: NodeEntity[];
  }
}
