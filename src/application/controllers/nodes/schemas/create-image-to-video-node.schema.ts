import { VideoTierEnum } from '@application/entities/node-enums';
import z from 'zod';

export const createImageToVideoNodeSchema = z.object({
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  tier: z.nativeEnum(VideoTierEnum).optional(),
});

export const createImageToVideoNodeParamsSchema = z.object({
  flowId: z.string().min(1),
});

export type CreateImageToVideoNodeSchemaBody = z.infer<typeof createImageToVideoNodeSchema>;
export type CreateImageToVideoNodeSchemaParams = z.infer<typeof createImageToVideoNodeParamsSchema>;
