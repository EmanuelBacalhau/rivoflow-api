import z from 'zod';

export const updateFlowSchema = z.object({
  title: z.string().min(1, '"title" must be at least 1 character long').optional(),
});

export const updateFlowSchemaParams = z.object({
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
});

export type UpdateFlowSchemaParams = z.infer<typeof updateFlowSchemaParams>;

export type UpdateFlowSchemaBody = z.infer<typeof updateFlowSchema>;
