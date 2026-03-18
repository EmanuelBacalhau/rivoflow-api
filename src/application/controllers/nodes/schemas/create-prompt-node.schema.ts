import z from 'zod';

export const createPromptNodeParamsSchema = z.object({
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
});

export const createPromptNodeSchema = z.object({
  position: z.object({
    x: z.number('"position.x" must be a number'),
    y: z.number('"position.y" must be a number'),
  }),
});

export type CreatePromptNodeSchemaParams = z.infer<typeof createPromptNodeParamsSchema>;
export type CreatePromptNodeSchemaBody = z.infer<typeof createPromptNodeSchema>;
