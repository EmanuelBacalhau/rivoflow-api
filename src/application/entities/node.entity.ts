import { BaseEntity } from '@application/contracts/abstracts/base.entity';
import { AspectRatioEnum, GenerationStatusEnum, QualityEnum } from './node-enums';

export class NodeEntity extends BaseEntity<NodeEntity.Attributes> {
  isPrompt(): this is NodeEntity & { attrs: { data: NodeEntity.PromptData } } {
    return this.attrs.nodeType === NodeEntity.NodeType.PROMPT;
  }

  isImage(): this is NodeEntity & { attrs: { data: NodeEntity.FileData } } {
    return (
      this.attrs.nodeType === NodeEntity.NodeType.IMAGE ||
      this.attrs.nodeType === NodeEntity.NodeType.RESULT_IMAGE
    );
  }

  isGeneration(): this is NodeEntity & { attrs: { data: NodeEntity.GenerationData } } {
    return this.attrs.nodeType === NodeEntity.NodeType.GENERATION_IMAGE;
  }
}

export namespace NodeEntity {
  export type Attributes = {
    flowId: string;
    nodeType: NodeType;
    position: Position;
    isExecuted: boolean;
    data: PromptData | FileData | GenerationData;
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

  export type PromptData = {
    prompt: string;
  };

  export type FileData = {
    key?: string | null;
    inputType?: string | null;
  };

  export type GenerationData = {
    model: string;
    status: GenerationStatusEnum;
    attempts: number;
    outputNodeId: string | null;
    aspectRatio: AspectRatioEnum;
    quality: QualityEnum;
    consumedCredits?: number;
  };

  export type AllAttributes = Attributes & BaseEntity.Attributes;
}
