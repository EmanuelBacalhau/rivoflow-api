import z from 'zod';

export const exchangeCodeQuerySchema = z.object({
  code: z.string().min(1, '"code" is required'),
  redirectUri: z.string().min(1, '"redirectUri" is required'),
});

export type ExchangeCodeSchemaQuery = z.infer<typeof exchangeCodeQuerySchema>;
