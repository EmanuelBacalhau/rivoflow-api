import { BaseEntity } from '@application/contracts/abstracts/base.entity';
import {
  AspectRatioEnum,
  GenerationStatusEnum,
  ImageSizeEnum,
  QualityEnum,
  UpscaleModelEnum,
  VideoAspectRatioEnum,
  VideoDurationEnum,
  VideoResolutionEnum,
  VideoTierEnum,
} from './node-enums';

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

  isVideo(): this is NodeEntity & { attrs: { data: NodeEntity.VideoFileData } } {
    return this.attrs.nodeType === NodeEntity.NodeType.RESULT_VIDEO;
  }

  isImageToVideo(): this is NodeEntity & { attrs: { data: NodeEntity.ImageToVideoData } } {
    return this.attrs.nodeType === NodeEntity.NodeType.GENERATION_IMAGE_TO_VIDEO;
  }

  isGeneration(): this is NodeEntity & { attrs: { data: NodeEntity.GenerationData } } {
    return this.attrs.nodeType === NodeEntity.NodeType.GENERATION_IMAGE;
  }

  isTextToImage(): this is NodeEntity & { attrs: { data: NodeEntity.TextToImageData } } {
    return this.attrs.nodeType === NodeEntity.NodeType.GENERATION_TEXT_TO_IMAGE;
  }

  isUpscale(): this is NodeEntity & { attrs: { data: NodeEntity.UpscaleData } } {
    return this.attrs.nodeType === NodeEntity.NodeType.GENERATION_UPSCALE;
  }

  isRemoveBg(): this is NodeEntity & { attrs: { data: NodeEntity.RemoveBgData } } {
    return this.attrs.nodeType === NodeEntity.NodeType.GENERATION_REMOVE_BG;
  }

  isAnyGeneration(): boolean {
    return [
      NodeEntity.NodeType.GENERATION_IMAGE,
      NodeEntity.NodeType.GENERATION_TEXT_TO_IMAGE,
      NodeEntity.NodeType.GENERATION_UPSCALE,
      NodeEntity.NodeType.GENERATION_REMOVE_BG,
      NodeEntity.NodeType.GENERATION_IMAGE_TO_VIDEO,
    ].includes(this.attrs.nodeType);
  }
}

export namespace NodeEntity {
  export type Attributes = {
    flowId: string;
    nodeType: NodeType;
    position: Position;
    isExecuted: boolean;
    data: PromptData | FileData | GenerationData | TextToImageData | UpscaleData | RemoveBgData | ImageToVideoData | VideoFileData;
  };

  export type Position = {
    x: number;
    y: number;
  };

  export enum NodeType {
    PROMPT = 'PROMPT',
    IMAGE = 'IMAGE',
    GENERATION_IMAGE = 'GENERATION_IMAGE',
    GENERATION_TEXT_TO_IMAGE = 'GENERATION_TEXT_TO_IMAGE',
    GENERATION_UPSCALE = 'GENERATION_UPSCALE',
    GENERATION_REMOVE_BG = 'GENERATION_REMOVE_BG',
    GENERATION_IMAGE_TO_VIDEO = 'GENERATION_IMAGE_TO_VIDEO',
    RESULT_IMAGE = 'RESULT_IMAGE',
    RESULT_VIDEO = 'RESULT_VIDEO',
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

  export type TextToImageData = {
    model: string;
    status: GenerationStatusEnum;
    attempts: number;
    outputNodeId: string | null;
    imageSize: ImageSizeEnum;
    guidanceScale: number;
    seed: number | null;
    consumedCredits?: number;
  };

  export type UpscaleData = {
    model: string;
    status: GenerationStatusEnum;
    attempts: number;
    outputNodeId: string | null;
    scale: number;
    face: boolean;
    upscaleModel: UpscaleModelEnum;
    consumedCredits?: number;
  };

  export type RemoveBgData = {
    model: string;
    status: GenerationStatusEnum;
    attempts: number;
    outputNodeId: string | null;
    consumedCredits?: number;
  };

  export type ImageToVideoData = {
    model: string;
    status: GenerationStatusEnum;
    attempts: number;
    outputNodeId: string | null;
    tier: VideoTierEnum;
    duration: VideoDurationEnum;
    resolution: VideoResolutionEnum;
    aspectRatio: VideoAspectRatioEnum;
    generateAudio: boolean;
    consumedCredits?: number;
  };

  export type VideoFileData = {
    key?: string | null;
    duration?: number | null;
    fps?: number | null;
  };

  export type AllAttributes = Attributes & BaseEntity.Attributes;
}
