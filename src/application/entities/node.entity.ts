import { BaseEntity } from '@application/contracts/abstracts/base.entity';
import {
  AspectRatioEnum,
  CharacterOrientationEnum,
  GenerationStatusEnum,
  QualityEnum,
  VideoAspectRatioEnum,
  VideoDurationEnum,
  VideoResolutionEnum,
  VideoTierEnum,
} from './node-enums';

export class NodeEntity extends BaseEntity<NodeEntity.Attributes> {
  isPrompt(): this is NodeEntity & {
    attrs: {
      data: NodeEntity.PromptData;
    };
  } {
    return this.attrs.nodeType === NodeEntity.NodeType.PROMPT;
  }

  isImage(): this is NodeEntity & {
    attrs: {
      data: NodeEntity.FileData;
    };
  } {
    return (
      this.attrs.nodeType === NodeEntity.NodeType.IMAGE ||
      this.attrs.nodeType === NodeEntity.NodeType.RESULT_IMAGE
    );
  }

  isVideo(): this is NodeEntity & {
    attrs: {
      data: NodeEntity.FileData;
    };
  } {
    return (
      this.attrs.nodeType === NodeEntity.NodeType.VIDEO ||
      this.attrs.nodeType === NodeEntity.NodeType.RESULT_VIDEO
    );
  }

  getVideoDuration(): number | null {
    if (this.isVideo()) return this.attrs.data.duration ?? null;
    return null;
  }

  getVideoKey(): string | null {
    if (this.isVideo()) return this.attrs.data.key ?? null;
    return null;
  }

  isImageToVideo(): this is NodeEntity & {
    attrs: {
      data: NodeEntity.ImageToVideoData;
    };
  } {
    return this.attrs.nodeType === NodeEntity.NodeType.GENERATION_IMAGE_TO_VIDEO;
  }

  isGeneration(): this is NodeEntity & {
    attrs: {
      data: NodeEntity.GenerationData;
    };
  } {
    return this.attrs.nodeType === NodeEntity.NodeType.GENERATION_IMAGE;
  }

  isTextToImage(): this is NodeEntity & {
    attrs: {
      data: NodeEntity.TextToImageData;
    };
  } {
    return this.attrs.nodeType === NodeEntity.NodeType.GENERATION_TEXT_TO_IMAGE;
  }

  isUpscale(): this is NodeEntity & {
    attrs: {
      data: NodeEntity.UpscaleData;
    };
  } {
    return this.attrs.nodeType === NodeEntity.NodeType.GENERATION_UPSCALE;
  }

  isRemoveBg(): this is NodeEntity & {
    attrs: {
      data: NodeEntity.RemoveBgData;
    };
  } {
    return this.attrs.nodeType === NodeEntity.NodeType.GENERATION_REMOVE_BG;
  }

  isMotionControl(): this is NodeEntity & {
    attrs: {
      data: NodeEntity.MotionControlData;
    };
  } {
    return this.attrs.nodeType === NodeEntity.NodeType.GENERATION_MOTION_CONTROL;
  }

  isAnyGeneration(): boolean {
    return [
      NodeEntity.NodeType.GENERATION_IMAGE,
      NodeEntity.NodeType.GENERATION_TEXT_TO_IMAGE,
      NodeEntity.NodeType.GENERATION_UPSCALE,
      NodeEntity.NodeType.GENERATION_REMOVE_BG,
      NodeEntity.NodeType.GENERATION_IMAGE_TO_VIDEO,
      NodeEntity.NodeType.GENERATION_MOTION_CONTROL,
    ].includes(this.attrs.nodeType);
  }
}

export namespace NodeEntity {
  export type Attributes = {
    flowId: string;
    nodeType: NodeType;
    position: Position;
    isExecuted: boolean;
    data:
      | PromptData
      | FileData
      | GenerationData
      | TextToImageData
      | UpscaleData
      | RemoveBgData
      | ImageToVideoData
      | MotionControlData;
  };

  export type Position = {
    x: number;
    y: number;
  };

  export enum NodeType {
    PROMPT = 'PROMPT',
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    GENERATION_IMAGE = 'GENERATION_IMAGE',
    GENERATION_TEXT_TO_IMAGE = 'GENERATION_TEXT_TO_IMAGE',
    GENERATION_UPSCALE = 'GENERATION_UPSCALE',
    GENERATION_REMOVE_BG = 'GENERATION_REMOVE_BG',
    GENERATION_IMAGE_TO_VIDEO = 'GENERATION_IMAGE_TO_VIDEO',
    GENERATION_MOTION_CONTROL = 'GENERATION_MOTION_CONTROL',
    RESULT_IMAGE = 'RESULT_IMAGE',
    RESULT_VIDEO = 'RESULT_VIDEO',
  }

  export type PromptData = {
    prompt: string;
  };

  export type FileData = {
    key?: string | null;
    inputType?: string | null;
    duration?: number | null;
    fps?: number | null;
  };

  export type GenerationData = {
    model: string;
    status: GenerationStatusEnum;
    attempts: number;
    outputNodeId: string | null;
    aspectRatio: AspectRatioEnum;
    quality: QualityEnum;
    consumedCredits?: number;
    falRequestId?: string | null;
  };

  export type TextToImageData = {
    model: string;
    status: GenerationStatusEnum;
    attempts: number;
    outputNodeId: string | null;
    aspectRatio: AspectRatioEnum;
    quality: QualityEnum;
    consumedCredits?: number;
    falRequestId?: string | null;
  };

  export type UpscaleData = {
    model: string;
    status: GenerationStatusEnum;
    attempts: number;
    outputNodeId: string | null;
    scale: number;
    consumedCredits?: number;
    falRequestId?: string | null;
  };

  export type RemoveBgData = {
    model: string;
    status: GenerationStatusEnum;
    attempts: number;
    outputNodeId: string | null;
    consumedCredits?: number;
    falRequestId?: string | null;
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
    falRequestId?: string | null;
  };

  export type MotionControlData = {
    model: string;
    status: GenerationStatusEnum;
    attempts: number;
    outputNodeId: string | null;
    characterOrientation: CharacterOrientationEnum;
    keepOriginalSound: boolean;
    consumedCredits?: number;
    falRequestId?: string | null;
  };

  export type AllAttributes = Attributes & BaseEntity.Attributes;
}
