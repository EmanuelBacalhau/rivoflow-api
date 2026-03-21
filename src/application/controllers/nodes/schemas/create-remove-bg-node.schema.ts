import z from 'zod';

export const createRemoveBgNodeSchema = z.object({
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export const createRemoveBgNodeParamsSchema = z.object({
  flowId: z.string().min(1),
});

export type CreateRemoveBgNodeSchemaBody = z.infer<typeof createRemoveBgNodeSchema>;
export type CreateRemoveBgNodeSchemaParams = z.infer<typeof createRemoveBgNodeParamsSchema>;
