import { AspectRatioEnum, QualityEnum } from '@application/entities/node-enums';
import z from 'zod';

export const updateGenerationNodeSchema = z.object({
  aspectRatio: z.nativeEnum(AspectRatioEnum).optional(),
  quality: z.nativeEnum(QualityEnum).optional(),
});

export const updateGenerationNodeParamsSchema = z.object({
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
  nodeId: z.string().min(1, '"nodeId" must be at least 1 character long'),
});

export type UpdateGenerationNodeSchemaBody = z.infer<typeof updateGenerationNodeSchema>;
export type UpdateGenerationNodeSchemaParams = z.infer<typeof updateGenerationNodeParamsSchema>;
