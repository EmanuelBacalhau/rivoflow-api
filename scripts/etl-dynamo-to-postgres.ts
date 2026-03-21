import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { accounts, accountBalances, flows, nodes, edges } from '../src/infra/database/drizzle/schema';

// ── Config ──────────────────────────────────────────────
const DYNAMO_TABLE = 'rivo-flow-api-prod-table';
const DYNAMO_REGION = 'sa-east-1';
const DATABASE_URL = process.env.DATABASE_URL!;

if (!DATABASE_URL) {
  console.error('DATABASE_URL env var is required');
  process.exit(1);
}

// ── Clients ─────────────────────────────────────────────
const dynamoClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: DYNAMO_REGION }),
);

const pgClient = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(pgClient);

// ── DynamoDB Scan ───────────────────────────────────────
async function scanAll(): Promise<Record<string, any>[]> {
  const items: Record<string, any>[] = [];
  let lastKey: Record<string, any> | undefined;

  do {
    const result = await dynamoClient.send(
      new ScanCommand({
        TableName: DYNAMO_TABLE,
        ExclusiveStartKey: lastKey,
      }),
    );
    items.push(...(result.Items ?? []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return items;
}

// ── Classify items by SK prefix ─────────────────────────
function classify(items: Record<string, any>[]) {
  const accountItems: Record<string, any>[] = [];
  const balanceItems: Record<string, any>[] = [];
  const flowItems: Record<string, any>[] = [];
  const nodeItems: Record<string, any>[] = [];
  const edgeItems: Record<string, any>[] = [];

  for (const item of items) {
    const sk = item.SK as string;
    if (sk.startsWith('ACCOUNT_BALANCE#')) balanceItems.push(item);
    else if (sk.startsWith('ACCOUNT#')) accountItems.push(item);
    else if (sk.startsWith('FLOW#')) flowItems.push(item);
    else if (sk.startsWith('NODE#')) nodeItems.push(item);
    else if (sk.startsWith('EDGE#')) edgeItems.push(item);
    else console.warn('Unknown SK prefix:', sk);
  }

  return { accountItems, balanceItems, flowItems, nodeItems, edgeItems };
}

// ── Transform & Insert ──────────────────────────────────
async function insertAccounts(items: Record<string, any>[]) {
  if (!items.length) return;

  const rows = items.map((item) => ({
    id: item.id,
    email: item.email,
    provider: item.provider,
    externalId: item.externalId,
    firstName: item.firstName,
    lastName: item.lastName ?? null,
    picture: item.picture,
    isActive: item.isActive ?? true,
    role: (item.role ?? 'USER') as 'USER' | 'ADMIN',
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));

  await db.insert(accounts).values(rows).onConflictDoNothing();
  console.log(`  ✓ ${rows.length} accounts`);
}

async function insertBalances(items: Record<string, any>[]) {
  if (!items.length) return;

  const rows = items.map((item) => ({
    id: item.id,
    accountId: item.accountId,
    balance: item.balance ?? 0,
    lifetimeDeposited: item.lifetimeDeposited ?? 0,
    lifetimeSpent: item.lifetimeSpent ?? 0,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));

  await db.insert(accountBalances).values(rows).onConflictDoNothing();
  console.log(`  ✓ ${rows.length} account_balances`);
}

async function insertFlows(items: Record<string, any>[]) {
  if (!items.length) return;

  const rows = items.map((item) => ({
    id: item.id,
    title: item.title,
    accountId: item.accountId,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));

  await db.insert(flows).values(rows).onConflictDoNothing();
  console.log(`  ✓ ${rows.length} flows`);
}

async function insertNodes(items: Record<string, any>[]) {
  if (!items.length) return;

  const rows = items.map((item) => ({
    id: item.id,
    flowId: item.flowId,
    positionX: item.position?.x ?? 0,
    positionY: item.position?.y ?? 0,
    isExecuted: item.isExecuted ?? false,
    totalTokens: item.totalTokens ?? 0,
    consumedCredits: item.consumedCredits ?? null,
    nodeType: item.data?.type as 'PROMPT' | 'IMAGE' | 'GENERATION_IMAGE' | 'RESULT_IMAGE',
    data: item.data,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));

  await db.insert(nodes).values(rows).onConflictDoNothing();
  console.log(`  ✓ ${rows.length} nodes`);
}

async function insertEdges(items: Record<string, any>[]) {
  if (!items.length) return;

  let inserted = 0;
  let skipped = 0;

  for (const item of items) {
    try {
      await db.insert(edges).values({
        id: item.id,
        flowId: item.flowId,
        sourceNodeId: item.sourceNodeId,
        targetNodeId: item.targetNodeId,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }).onConflictDoNothing();
      inserted++;
    } catch {
      skipped++;
    }
  }

  console.log(`  ✓ ${inserted} edges (${skipped} skipped - orphan FK)`);
}

// ── Main ────────────────────────────────────────────────
async function main() {
  console.log('Scanning DynamoDB table:', DYNAMO_TABLE);
  const items = await scanAll();
  console.log(`Found ${items.length} total items\n`);

  const { accountItems, balanceItems, flowItems, nodeItems, edgeItems } = classify(items);

  console.log('Breakdown:');
  console.log(`  accounts: ${accountItems.length}`);
  console.log(`  balances: ${balanceItems.length}`);
  console.log(`  flows:    ${flowItems.length}`);
  console.log(`  nodes:    ${nodeItems.length}`);
  console.log(`  edges:    ${edgeItems.length}`);
  console.log();

  // Insert in order (FK constraints)
  console.log('Inserting into Postgres...');
  await insertAccounts(accountItems);
  await insertBalances(balanceItems);
  await insertFlows(flowItems);
  await insertNodes(nodeItems);
  await insertEdges(edgeItems);

  console.log('\nETL complete!');
  await pgClient.end();
}

main().catch((err) => {
  console.error('ETL failed:', err);
  process.exit(1);
});
