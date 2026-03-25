import { neon } from '@neondatabase/serverless';
import { env } from '@shared/config/env';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(env.DATABASE_URL);

export const db = drizzle(sql, {
  schema,
});

export type Database = typeof db;
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
