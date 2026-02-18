import z from 'zod';

export const schema = z.object({
  // Database
  DYNAMO_TABLE: z.string().min(1),
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
});

export const env = schema.parse(process.env);
