import { NodeEntity } from '@application/entities/node.entity';
import z from 'zod';

const baseSchema = z.object({
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
  position: z
    .object({
      x: z.number('"position.x" must be a number'),
      y: z.number('"position.y" must be a number'),
    })
    .optional(),
});

const promptUpdateSchema = baseSchema.extend({
  nodeType: z.literal(NodeEntity.NodeType.PROMPT),
  data: z
    .object({
      type: z.literal(NodeEntity.NodeType.PROMPT),
      prompt: z.string().min(1, '"prompt" must be at least 1 character long'),
    })
    .optional(),
});

const imageUpdateSchema = baseSchema.extend({
  nodeType: z.literal(NodeEntity.NodeType.IMAGE),
});

const generationUpdateSchema = baseSchema.extend({
  nodeType: z.literal(NodeEntity.NodeType.GENERATION_IMAGE),
  data: z
    .object({
      type: z.literal(NodeEntity.NodeType.GENERATION_IMAGE),
      model: z.string(),
      parameters: z.object({
        aspectRatio: z.enum(NodeEntity.AspectRatioEnum),
        quality: z.enum(NodeEntity.QualityEnum),
      }),
      status: z.enum(NodeEntity.GenerationStatusEnum),
    })
    .optional(),
});

const resultUpdateSchema = baseSchema.extend({
  nodeType: z.literal(NodeEntity.NodeType.RESULT),
  data: z
    .object({
      type: z.literal(NodeEntity.NodeType.RESULT),
      key: z.string().min(1, '"key" must be at least 1 character long'),
    })
    .optional(),
});

export const updateNodeSchema = z.discriminatedUnion('nodeType', [
  promptUpdateSchema,
  imageUpdateSchema,
  generationUpdateSchema,
  resultUpdateSchema,
]);

export const updateNodeParamsSchema = z.object({
  nodeId: z.string().min(1, '"nodeId" must be at least 1 character long'),
});

export type UpdateNodeSchemaBody = z.infer<typeof updateNodeSchema>;

export type UpdateNodeSchemaParams = z.infer<typeof updateNodeParamsSchema>;
