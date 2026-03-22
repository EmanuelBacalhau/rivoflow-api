import z from 'zod';

export const updateUpscaleNodeSchema = z.object({
  scale: z.number().int().min(1).max(10).optional(),
});

export const updateUpscaleNodeParamsSchema = z.object({
  flowId: z.string().min(1),
  nodeId: z.string().min(1),
});

export type UpdateUpscaleNodeSchemaBody = z.infer<typeof updateUpscaleNodeSchema>;
export type UpdateUpscaleNodeSchemaParams = z.infer<typeof updateUpscaleNodeParamsSchema>;
