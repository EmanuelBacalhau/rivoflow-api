import z from 'zod';

export const schema = z.object({
  // Database
  DATABASE_URL: z.string().url().min(1),
  // Buckets
  RIVO_FLOW_BUCKET: z.string().min(1),
  // Queue
  IMAGE_QUEUE_URL: z.string().min(1),
  // AI
  GOOGLE_GENAI_API_KEY: z.string().min(1),
  // COGNITO
  COGNITO_CLIENT_ID: z.string().min(1),
  COGNITO_CLIENT_SECRET: z.string().min(1),
  COGNITO_POOL_DOMAIN: z.string().min(1),
  // CDN
  CDN_DOMAIN_NAME: z.string().min(1),
  // Environment
  IS_PRODUCTION: z
    .enum(
      [
        'true',
        'false',
      ],
      {
        message: 'IS_PRODUCTION must be either "true" or "false"',
      },
    )
    .default('false'),
  // Payments
  ABACATE_PAY_GATEWAY: z.string().min(1),
  REDIRECT_SUCCESS_URL: z.string().min(1),
  REDIRECT_CANCEL_URL: z.string().min(1),
  WEBHOOK_SECRET: z.string().min(1),
  AWESOMEAPI_KEY: z.string().min(1),
});

export const env = schema.parse(process.env);
