import { UpscaleModelEnum } from '@application/entities/node-enums';
import z from 'zod';

export const updateUpscaleNodeSchema = z.object({
  scale: z.number().int().min(1).max(8).optional(),
  face: z.boolean().optional(),
  upscaleModel: z.nativeEnum(UpscaleModelEnum).optional(),
});

export const updateUpscaleNodeParamsSchema = z.object({
  flowId: z.string().min(1),
  nodeId: z.string().min(1),
});

export type UpdateUpscaleNodeSchemaBody = z.infer<typeof updateUpscaleNodeSchema>;
export type UpdateUpscaleNodeSchemaParams = z.infer<typeof updateUpscaleNodeParamsSchema>;
