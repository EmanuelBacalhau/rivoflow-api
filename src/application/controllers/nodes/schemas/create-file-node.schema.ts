import z from 'zod';

export const createFileNodeParamsSchema = z.object({
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
});

export const createFileNodeSchema = z.object({
  position: z.object({
    x: z.number('"position.x" must be a number'),
    y: z.number('"position.y" must be a number'),
  }),
  inputType: z.enum(
    [
      'IMAGE',
      'VIDEO',
    ],
    '"inputType" must be either "IMAGE" or "VIDEO"',
  ),
});

export type CreateFileNodeSchemaParams = z.infer<typeof createFileNodeParamsSchema>;
export type CreateFileNodeSchemaBody = z.infer<typeof createFileNodeSchema>;
