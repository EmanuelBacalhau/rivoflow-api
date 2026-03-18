import { BaseEntity } from '@application/contracts/abstracts/base.entity';
import { AspectRatioEnum, GenerationStatusEnum, QualityEnum } from './node-enums';

export class NodeEntity extends BaseEntity<NodeEntity.Attributes> {}

export namespace NodeEntity {
  export type Attributes = {
    flowId: string;
    position: Position;
    isExecuted: boolean;
    totalTokens: number;
    consumedCredits?: number;
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

  export type PromptNodeData = {
    type: NodeType.PROMPT;
    prompt: string;
  };

  export type FileNodeData = {
    type: NodeType.IMAGE | NodeType.RESULT_IMAGE;
    key?: string | null;
    inputType?: 'IMAGE' | 'VIDEO' | null;
  };

  export type GenerationImageNodeData = {
    type: NodeType.GENERATION_IMAGE;
    model: string;
    inputs: string[];
    parameters: {
      aspectRatio: AspectRatioEnum;
      quality: QualityEnum;
    };
    status: GenerationStatusEnum;
    attempts: number;
    outputNodeId: string | null;
  };

  export type NodeData = PromptNodeData | FileNodeData | GenerationImageNodeData;

  export type AllAttributes = Attributes & BaseEntity.Attributes;
}
