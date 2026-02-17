import { NodeEntity } from '@application/entities/node.entity';
import z from 'zod';

const baseCreateSchema = z.object({
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
  position: z.object({
    x: z.number('"position.x" must be a number'),
    y: z.number('"position.y" must be a number'),
  }),
});

const createPromptNodeSchema = baseCreateSchema.extend({
  nodeType: z.literal(NodeEntity.NodeType.PROMPT),
});

const createImageNodeSchema = baseCreateSchema.extend({
  nodeType: z.literal(NodeEntity.NodeType.IMAGE),
});

const createGenerationNodeSchema = baseCreateSchema.extend({
  nodeType: z.literal(NodeEntity.NodeType.GENERATION_IMAGE),
});

export const createNodeSchema = z.discriminatedUnion('nodeType', [
  createPromptNodeSchema,
  createImageNodeSchema,
  createGenerationNodeSchema,
]);

export type CreateNodeSchemaBody = z.infer<typeof createNodeSchema>;
