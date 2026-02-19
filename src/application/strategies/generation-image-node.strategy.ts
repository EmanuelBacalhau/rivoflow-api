import { INodeCreationStrategy } from '@application/contracts/interfaces/node-creation-strategy';
import { NodeEntity } from '@application/entities/node.entity';

const DEFAULT_AI_MODEL = 'gemini-3-pro-image-preview';

const DEFAULT_PARAMETERS: NodeEntity.NodeDataGenerationImage['parameters'] = {
  aspectRatio: NodeEntity.AspectRatioEnum['1:1'],
  quality: NodeEntity.QualityEnum['1K'],
};

export class GenerationImageNodeStrategy implements INodeCreationStrategy {
  prepareData(): NodeEntity.NodeDataGenerationImage {
    return {
      type: NodeEntity.NodeType.GENERATION_IMAGE,
      model: DEFAULT_AI_MODEL,
      inputs: [],
      parameters: DEFAULT_PARAMETERS,
      status: NodeEntity.GenerationStatusEnum.PENDING,
      attempts: 0,
      outputNodeId: null,
      totalTokens: 0,
    };
  }
}
