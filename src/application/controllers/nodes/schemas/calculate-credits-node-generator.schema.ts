import z from 'zod';

export const calculateCreditsNodeGeneratorParamsSchema = z.object({
  nodeId: z.string().min(1, '"nodeId" must be at least 1 character long'),
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
});

export type CalculateCreditsNodeGeneratorSchemaParams = z.infer<
  typeof calculateCreditsNodeGeneratorParamsSchema
>;
