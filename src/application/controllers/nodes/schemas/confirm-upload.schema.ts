import z from 'zod';

export const confirmUploadBodySchema = z.object({
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
});

export const confirmUploadParamsSchema = z.object({
  nodeId: z.string().min(1, '"nodeId" must be at least 1 character long'),
});

export type ConfirmUploadSchemaBody = z.infer<typeof confirmUploadBodySchema>;
export type ConfirmUploadSchemaParams = z.infer<typeof confirmUploadParamsSchema>;
