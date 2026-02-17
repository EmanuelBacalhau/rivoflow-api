import { NodeEntity } from '@application/entities/node.entity';
import z from 'zod';

export const updateNodeSchema = z.object({
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
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
          aspectRatio: z.nativeEnum(NodeEntity.AspectRatioEnum),
          quality: z.nativeEnum(NodeEntity.QualityEnum),
        })
        .optional(),
    })
    .optional(),
});

export const updateNodeParamsSchema = z.object({
  nodeId: z.string().min(1, '"nodeId" must be at least 1 character long'),
});

export type UpdateNodeSchemaBody = z.infer<typeof updateNodeSchema>;

export type UpdateNodeSchemaParams = z.infer<typeof updateNodeParamsSchema>;
