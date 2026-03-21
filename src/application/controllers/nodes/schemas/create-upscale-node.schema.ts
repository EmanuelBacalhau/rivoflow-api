import z from 'zod';

export const createUpscaleNodeSchema = z.object({
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export const createUpscaleNodeParamsSchema = z.object({
  flowId: z.string().min(1),
});

export type CreateUpscaleNodeSchemaBody = z.infer<typeof createUpscaleNodeSchema>;
export type CreateUpscaleNodeSchemaParams = z.infer<typeof createUpscaleNodeParamsSchema>;
