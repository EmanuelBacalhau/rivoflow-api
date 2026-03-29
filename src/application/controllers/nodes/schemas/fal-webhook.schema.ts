import z from 'zod';

export const falWebhookBodySchema = z.object({
  request_id: z.string().min(1),
  status: z.enum(
    [
      'OK',
      'ERROR',
    ],
    {
      message: 'status must be OK or ERROR',
    },
  ),
  payload: z.any().optional(),
  error: z.string().optional(),
});

export const falWebhookQuerySchema = z.object({
  secret: z.string().min(1),
});

export type FalWebhookSchemaBody = z.infer<typeof falWebhookBodySchema>;
export type FalWebhookSchemaQuery = z.infer<typeof falWebhookQuerySchema>;
