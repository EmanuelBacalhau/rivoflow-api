import { AspectRatioEnum, QualityEnum } from '@application/entities/node-enums';
import z from 'zod';

export const updateTextToImageNodeSchema = z.object({
  aspectRatio: z.nativeEnum(AspectRatioEnum).optional(),
  quality: z.nativeEnum(QualityEnum).optional(),
});

export const updateTextToImageNodeParamsSchema = z.object({
  flowId: z.string().min(1),
  nodeId: z.string().min(1),
});

export type UpdateTextToImageNodeSchemaBody = z.infer<typeof updateTextToImageNodeSchema>;
export type UpdateTextToImageNodeSchemaParams = z.infer<typeof updateTextToImageNodeParamsSchema>;
