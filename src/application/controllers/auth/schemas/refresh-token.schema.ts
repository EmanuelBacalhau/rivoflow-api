import z from 'zod';

export const refreshTokenBodySchema = z.object({
  refreshToken: z.string().min(1, '"refreshToken" is required'),
});

export type RefreshTokenSchemaBody = z.infer<typeof refreshTokenBodySchema>;
