import z from 'zod';

export const createEdgeSchema = z.object({
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
  sourceNodeId: z.string().min(1, '"sourceNodeId" must be at least 1 character long'),
  targetNodeId: z.string().min(1, '"targetNodeId" must be at least 1 character long'),
});

export type CreateEdgeSchemaBody = z.infer<typeof createEdgeSchema>;
