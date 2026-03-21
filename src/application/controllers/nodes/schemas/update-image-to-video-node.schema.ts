import {
  VideoAspectRatioEnum,
  VideoDurationEnum,
  VideoResolutionEnum,
  VideoTierEnum,
} from '@application/entities/node-enums';
import z from 'zod';

export const updateImageToVideoNodeSchema = z.object({
  tier: z.nativeEnum(VideoTierEnum).optional(),
  duration: z.nativeEnum(VideoDurationEnum).optional(),
  resolution: z.nativeEnum(VideoResolutionEnum).optional(),
  aspectRatio: z.nativeEnum(VideoAspectRatioEnum).optional(),
  generateAudio: z.boolean().optional(),
});

export const updateImageToVideoNodeParamsSchema = z.object({
  flowId: z.string().min(1),
  nodeId: z.string().min(1),
});

export type UpdateImageToVideoNodeSchemaBody = z.infer<typeof updateImageToVideoNodeSchema>;
export type UpdateImageToVideoNodeSchemaParams = z.infer<typeof updateImageToVideoNodeParamsSchema>;
