import z from 'zod';

export const uploadFileBodySchema = z.object({
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
  file: z.object({
    type: z.string().min(1, '"file.type" must be at least 1 character long'),
    size: z.number('"file.size" must be a number'),
  }),
});

export const uploadFileParamsSchema = z.object({
  nodeId: z.string().min(1, '"nodeId" must be at least 1 character long'),
});

export type UploadFileSchemaBody = z.infer<typeof uploadFileBodySchema>;

export type UploadFileSchemaParams = z.infer<typeof uploadFileParamsSchema>;
