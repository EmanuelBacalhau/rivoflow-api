import { CharacterOrientationEnum } from '@application/entities/node-enums';
import z from 'zod';

export const updateMotionControlNodeSchema = z.object({
  characterOrientation: z.nativeEnum(CharacterOrientationEnum).optional(),
  keepOriginalSound: z.boolean().optional(),
});

export const updateMotionControlNodeParamsSchema = z.object({
  flowId: z.string().min(1),
  nodeId: z.string().min(1),
});

export type UpdateMotionControlNodeSchemaBody = z.infer<typeof updateMotionControlNodeSchema>;
export type UpdateMotionControlNodeSchemaParams = z.infer<typeof updateMotionControlNodeParamsSchema>;
