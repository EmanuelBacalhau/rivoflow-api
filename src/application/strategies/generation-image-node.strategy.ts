import { INodeCreationStrategy } from '@application/contracts/interfaces/node-creation-strategy';
import { NodeEntity } from '@application/entities/node.entity';

export class GenerationImageNodeStrategy implements INodeCreationStrategy {
  prepareData(): NodeEntity.NodeDataGeneration {
    return {
      type: NodeEntity.NodeType.GENERATION_IMAGE,
      model: '',
      inputs: [],
      parameters: {
        aspectRatio: NodeEntity.AspectRatioEnum['1:1'],
        quality: NodeEntity.QualityEnum['1K'],
      },
      status: NodeEntity.GenerationStatusEnum.PENDING,
    };
  }
}
