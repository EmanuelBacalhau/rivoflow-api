import { BaseEntity } from '@application/contracts/abstracts/base.entity';

export class NodeEntity extends BaseEntity<NodeEntity.Attributes> {}

export namespace NodeEntity {
  export type Attributes = {
    flowId: string;
    position: Position;
    isExecuted: boolean;
    data: NodeData;
  };

  export type Position = {
    x: number;
    y: number;
  };

  export enum NodeType {
    PROMPT = 'PROMPT',
    IMAGE = 'IMAGE',
    GENERATION_IMAGE = 'GENERATION_IMAGE',
    RESULT_IMAGE = 'RESULT_IMAGE',
  }

  export type NodeDataPrompt = {
    type: NodeType.PROMPT;
    prompt: string;
    totalTokens: number;
  };

  export type NodeDataFile = {
    type: NodeType.IMAGE | NodeType.RESULT_IMAGE;
    key: string | null;
    inputType: 'VIDEO' | 'IMAGE' | null;
    totalTokens: number;
    consumedCredits?: number;
  };

  export enum GenerationStatusEnum {
    PENDING = 'pending',
    QUEUED = 'queued',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
  }

  export enum AspectRatioEnum {
    '1:1' = '1:1',
    '16:9' = '16:9',
    '4:3' = '4:3',
    '9:16' = '9:16',
  }

  export enum QualityEnum {
    '1K' = '1K',
    '2K' = '2K',
    '4K' = '4K',
  }

  export type NodeDataGenerationImage = {
    type: NodeType.GENERATION_IMAGE;
    model: string;
    parameters: {
      aspectRatio: AspectRatioEnum;
      quality: QualityEnum;
    };
    inputs: string[];
    outputNodeId: string | null;
    attempts: number;
    status: GenerationStatusEnum;
    totalTokens: number;
    consumedCredits?: number;
  };

  export type NodeData = NodeDataPrompt | NodeDataFile | NodeDataGenerationImage;

  export type AllAttributes = Attributes & BaseEntity.Attributes;
}
