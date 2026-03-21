import z from 'zod';

export const updateNodePositionSchema = z.object({
  position: z.object({
    x: z.number('"position.x" must be a number'),
    y: z.number('"position.y" must be a number'),
  }),
});

export const updateNodePositionParamsSchema = z.object({
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
  nodeId: z.string().min(1, '"nodeId" must be at least 1 character long'),
});

export type UpdateNodePositionSchemaBody = z.infer<typeof updateNodePositionSchema>;
export type UpdateNodePositionSchemaParams = z.infer<typeof updateNodePositionParamsSchema>;
