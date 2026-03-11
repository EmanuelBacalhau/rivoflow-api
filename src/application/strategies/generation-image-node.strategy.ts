import { INodeBehaviorStrategy } from '@application/contracts/interfaces/node-creation-strategy';
import { NodeEntity } from '@application/entities/node.entity';
import {
  AspectRatioEnum,
  GenerationStatusEnum,
  QualityEnum,
} from '@application/entities/node-enums';
import { CreditCalculationService } from '@application/services/credit-calculation.service';
import { Injectable } from 'src/kernel/decorators/injectable';

const DEFAULT_AI_MODEL = 'gemini-3-pro-image-preview';

const DEFAULT_PARAMETERS: NodeEntity.GenerationImageNodeData['parameters'] = {
  aspectRatio: AspectRatioEnum['1:1'],
  quality: QualityEnum['1K'],
};

@Injectable()
export class GenerationImageNodeStrategy
  implements INodeBehaviorStrategy<NodeEntity.GenerationImageNodeData>
{
  constructor(private readonly creditCalculationService: CreditCalculationService) {}

  prepareData(): NodeEntity.GenerationImageNodeData {
    return {
      type: NodeEntity.NodeType.GENERATION_IMAGE,
      model: DEFAULT_AI_MODEL,
      inputs: [],
      parameters: DEFAULT_PARAMETERS,
      status: GenerationStatusEnum.PENDING,
      attempts: 0,
      outputNodeId: null,
      totalTokens: 0,
    };
  }

  async update(
    node: NodeEntity,
    data?: Partial<Omit<NodeEntity.GenerationImageNodeData, 'type'>>,
    position?: NodeEntity.Position,
  ): Promise<void> {
    const currentData = node.attrs.data as NodeEntity.GenerationImageNodeData;
    const newParameters = data?.parameters ?? currentData.parameters;

    node.updateAttributes({
      data: {
        ...currentData,
        parameters: newParameters,
      },
      ...(position && {
        position,
      }),
    });
  }

  async calculateCredits(node: NodeEntity, inputNodes: NodeEntity[]): Promise<number> {
    const { creditsRequired } = await this.creditCalculationService.calculateForGenerationNode({
      generatorNodeData: node.attrs.data as NodeEntity.GenerationImageNodeData,
      inputNodes,
    });

    return creditsRequired;
  }
}
