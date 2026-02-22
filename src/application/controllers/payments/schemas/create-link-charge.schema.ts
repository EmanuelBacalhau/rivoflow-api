import z from 'zod';

export const createLinkChargeBodySchema = z.object({
  amount: z.number().min(1, '"amount" must be at least 1 character long'),
});

export type CreateLinkChargeSchemaBody = z.infer<typeof createLinkChargeBodySchema>;
