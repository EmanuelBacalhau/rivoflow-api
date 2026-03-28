import z from 'zod';

export const updatePromptNodeSchema = z.object({
  prompt: z.string(),
});

export const updatePromptNodeParamsSchema = z.object({
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
  nodeId: z.string().min(1, '"nodeId" must be at least 1 character long'),
});

export type UpdatePromptNodeSchemaBody = z.infer<typeof updatePromptNodeSchema>;
export type UpdatePromptNodeSchemaParams = z.infer<typeof updatePromptNodeParamsSchema>;
