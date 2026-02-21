import z from 'zod';

export const deleteFlowSchema = z.object({
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
});

export type DeleteFlowSchemaParams = z.infer<typeof deleteFlowSchema>;
