import z from 'zod';

export const createFlowSchema = z.object({
  title: z.string().min(1, '"title" must be at least 1 character long'),
  projectId: z.string().min(1, '"projectId" must be at least 1 character long'),
});

export type CreateFlowSchemaBody = z.infer<typeof createFlowSchema>;
