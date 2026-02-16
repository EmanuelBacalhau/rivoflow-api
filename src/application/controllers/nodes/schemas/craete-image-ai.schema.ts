import z from 'zod';

export const createImageAISchema = z.object({
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
  nodeGeneratorId: z.string().min(1, '"nodeGeneratorId" must be at least 1 character long'),
  inputs: z
    .array(z.string().min(1, '"inputs" must contain at least one non-empty string'))
    .min(1, '"inputs" must contain at least one input'),
});

export type CreateImageAiSchemaBody = z.infer<typeof createImageAISchema>;
