import { z } from 'zod';

export const simulateCreditsQuerySchema = z.object({
  amount: z.coerce.number().positive(),
});

export type SimulateCreditsSchemaQuery = z.infer<typeof simulateCreditsQuerySchema>;
