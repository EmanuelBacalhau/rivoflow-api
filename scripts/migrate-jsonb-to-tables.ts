import { readFileSync } from 'fs';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL!;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

async function main() {
  const sql = postgres(DATABASE_URL, { max: 1 });
  const migration = readFileSync('scripts/migrate-jsonb-to-tables.sql', 'utf-8');

  const statements = migration
    .split(';')
    .map((s) => s.replace(/--.*$/gm, '').trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await sql.unsafe(stmt);
      console.log('OK:', stmt.substring(0, 70).replace(/\n/g, ' '));
    } catch (err: any) {
      console.error('FAIL:', stmt.substring(0, 70).replace(/\n/g, ' '));
      console.error('  ', err.message);
    }
  }

  await sql.end();
  console.log('\nMigration complete!');
}

main();
