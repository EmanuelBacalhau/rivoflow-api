import z from 'zod';

export const getFlowByIdSchema = z.object({
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
});

export type GetFlowByIdSchemaBody = z.infer<typeof getFlowByIdSchema>;
