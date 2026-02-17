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
});

export const env = schema.parse(process.env);
