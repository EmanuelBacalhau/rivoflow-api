import z from 'zod';

export const confirmUploadParamsSchema = z.object({
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
  nodeId: z.string().min(1, '"nodeId" must be at least 1 character long'),
});

export type ConfirmUploadSchemaParams = z.infer<typeof confirmUploadParamsSchema>;
