import z from 'zod';

export const deleteEdgeSchema = z.object({
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
  edgeId: z.string().min(1, '"edgeId" must be at least 1 character long'),
});

export type DeleteEdgeSchemaBody = z.infer<typeof deleteEdgeSchema>;
