import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let client: ReturnType<typeof postgres> | null = null;

function getClient() {
  if (!client) {
    client = postgres(process.env.DATABASE_URL!, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false, // Required for Supabase transaction pooler (port 6543)
    });
  }
  return client;
}

export const db = drizzle(getClient(), { schema });

export type Database = typeof db;
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
