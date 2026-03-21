import z from 'zod';

export const createTextToImageNodeSchema = z.object({
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export const createTextToImageNodeParamsSchema = z.object({
  flowId: z.string().min(1),
});

export type CreateTextToImageNodeSchemaBody = z.infer<typeof createTextToImageNodeSchema>;
export type CreateTextToImageNodeSchemaParams = z.infer<typeof createTextToImageNodeParamsSchema>;
