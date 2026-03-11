import { AspectRatioEnum, QualityEnum } from '@application/entities/node-enums';
import z from 'zod';

export const updateNodeSchema = z.object({
  position: z
    .object({
      x: z.number('"position.x" must be a number'),
      y: z.number('"position.y" must be a number'),
    })
    .optional(),
  data: z
    .object({
      prompt: z.string().optional(),
      parameters: z
        .object({
          aspectRatio: z.enum(AspectRatioEnum),
          quality: z.enum(QualityEnum),
        })
        .optional(),
    })
    .optional(),
});

export const updateNodeParamsSchema = z.object({
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
  nodeId: z.string().min(1, '"nodeId" must be at least 1 character long'),
});

export type UpdateNodeSchemaBody = z.infer<typeof updateNodeSchema>;
export type UpdateNodeSchemaParams = z.infer<typeof updateNodeParamsSchema>;
