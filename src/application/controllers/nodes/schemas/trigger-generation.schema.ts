import z from 'zod';

export const triggerGenerationParamsSchema = z.object({
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
  nodeId: z.string().min(1, '"nodeId" must be at least 1 character long'),
});

export type TriggerGenerationSchemaParams = z.infer<typeof triggerGenerationParamsSchema>;
