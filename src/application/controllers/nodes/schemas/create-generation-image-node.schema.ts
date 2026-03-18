import z from 'zod';

export const createGenerationImageNodeParamsSchema = z.object({
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
});

export const createGenerationImageNodeSchema = z.object({
  position: z.object({
    x: z.number('"position.x" must be a number'),
    y: z.number('"position.y" must be a number'),
  }),
});

export type CreateGenerationImageNodeSchemaParams = z.infer<
  typeof createGenerationImageNodeParamsSchema
>;
export type CreateGenerationImageNodeSchemaBody = z.infer<typeof createGenerationImageNodeSchema>;
