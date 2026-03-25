import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const poolClient = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(poolClient, {
  schema,
});

export type Database = typeof db;
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
