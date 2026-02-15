import { NodeEntity } from '@application/entities/node.entity';
import z from 'zod';

export const createNodeSchema = z.object({
  position: z.object({
    x: z.number('"position.x" must be a number').default(0),
    y: z.number('"position.y" must be a number').default(0),
  }),
  flowId: z.string().min(1, '"flowId" must be at least 1 character long'),
  nodeType: z.enum(NodeEntity.NodeType),
});

export type CreateNodeSchemaBody = z.infer<typeof createNodeSchema>;
