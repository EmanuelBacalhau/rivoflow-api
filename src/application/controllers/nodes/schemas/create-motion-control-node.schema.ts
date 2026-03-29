import z from 'zod';

export const createMotionControlNodeSchema = z.object({
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export const createMotionControlNodeParamsSchema = z.object({
  flowId: z.string().min(1),
});

export type CreateMotionControlNodeSchemaBody = z.infer<typeof createMotionControlNodeSchema>;
export type CreateMotionControlNodeSchemaParams = z.infer<
  typeof createMotionControlNodeParamsSchema
>;
