import { relations } from 'drizzle-orm';
import { boolean, integer, pgEnum, pgTable, real, text, timestamp } from 'drizzle-orm/pg-core';

// Enums
export const accountRoleEnum = pgEnum('account_role', ['USER', 'ADMIN']);
export const nodeTypeEnum = pgEnum('node_type', ['PROMPT', 'IMAGE', 'GENERATION_IMAGE', 'RESULT_IMAGE']);
export const generationStatusEnum = pgEnum('generation_status', ['PENDING', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED']);
export const qualityEnum = pgEnum('quality', ['0.5K', '1K', '2K', '4K']);
export const aspectRatioEnum = pgEnum('aspect_ratio', ['1:1', '1:4', '1:8', '2:3', '3:2', '3:4', '4:1', '4:3', '4:5', '5:4', '8:1', '9:16', '16:9', '21:9']);

// Tables
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  provider: text('provider').notNull(),
  externalId: text('external_id').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name'),
  picture: text('picture').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  role: accountRoleEnum('role').notNull().default('USER'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const accountBalances = pgTable('account_balances', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().unique().references(() => accounts.id, { onDelete: 'cascade' }),
  balance: integer('balance').notNull().default(0),
  lifetimeDeposited: integer('lifetime_deposited').notNull().default(0),
  lifetimeSpent: integer('lifetime_spent').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const flows = pgTable('flows', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const nodes = pgTable('nodes', {
  id: text('id').primaryKey(),
  flowId: text('flow_id').notNull().references(() => flows.id, { onDelete: 'cascade' }),
  nodeType: nodeTypeEnum('node_type').notNull(),
  positionX: real('position_x').notNull(),
  positionY: real('position_y').notNull(),
  isExecuted: boolean('is_executed').notNull().default(false),
  totalTokens: integer('total_tokens').notNull().default(0),
  consumedCredits: integer('consumed_credits'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const promptNodeData = pgTable('prompt_node_data', {
  nodeId: text('node_id').primaryKey().references(() => nodes.id, { onDelete: 'cascade' }),
  prompt: text('prompt').notNull().default(''),
});

export const fileNodeData = pgTable('file_node_data', {
  nodeId: text('node_id').primaryKey().references(() => nodes.id, { onDelete: 'cascade' }),
  key: text('key'),
  inputType: text('input_type'),
});

export const generationNodeData = pgTable('generation_node_data', {
  nodeId: text('node_id').primaryKey().references(() => nodes.id, { onDelete: 'cascade' }),
  model: text('model').notNull(),
  status: generationStatusEnum('status').notNull().default('PENDING'),
  attempts: integer('attempts').notNull().default(0),
  outputNodeId: text('output_node_id'),
  aspectRatio: aspectRatioEnum('aspect_ratio').notNull().default('1:1'),
  quality: qualityEnum('quality').notNull().default('1K'),
});

// Relations
export const accountsRelations = relations(accounts, ({ one, many }) => ({
  balance: one(accountBalances, { fields: [accounts.id], references: [accountBalances.accountId] }),
  flows: many(flows),
}));

export const accountBalancesRelations = relations(accountBalances, ({ one }) => ({
  account: one(accounts, { fields: [accountBalances.accountId], references: [accounts.id] }),
}));

export const flowsRelations = relations(flows, ({ one, many }) => ({
  account: one(accounts, { fields: [flows.accountId], references: [accounts.id] }),
  nodes: many(nodes),
  edges: many(edges),
}));

export const nodesRelations = relations(nodes, ({ one }) => ({
  flow: one(flows, { fields: [nodes.flowId], references: [flows.id] }),
  promptData: one(promptNodeData, { fields: [nodes.id], references: [promptNodeData.nodeId] }),
  fileData: one(fileNodeData, { fields: [nodes.id], references: [fileNodeData.nodeId] }),
  generationData: one(generationNodeData, { fields: [nodes.id], references: [generationNodeData.nodeId] }),
}));

export const promptNodeDataRelations = relations(promptNodeData, ({ one }) => ({
  node: one(nodes, { fields: [promptNodeData.nodeId], references: [nodes.id] }),
}));

export const fileNodeDataRelations = relations(fileNodeData, ({ one }) => ({
  node: one(nodes, { fields: [fileNodeData.nodeId], references: [nodes.id] }),
}));

export const generationNodeDataRelations = relations(generationNodeData, ({ one }) => ({
  node: one(nodes, { fields: [generationNodeData.nodeId], references: [nodes.id] }),
}));

export const edges = pgTable('edges', {
  id: text('id').primaryKey(),
  flowId: text('flow_id').notNull().references(() => flows.id, { onDelete: 'cascade' }),
  sourceNodeId: text('source_node_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  targetNodeId: text('target_node_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const edgesRelations = relations(edges, ({ one }) => ({
  flow: one(flows, { fields: [edges.flowId], references: [flows.id] }),
  sourceNode: one(nodes, { fields: [edges.sourceNodeId], references: [nodes.id], relationName: 'sourceNode' }),
  targetNode: one(nodes, { fields: [edges.targetNodeId], references: [nodes.id], relationName: 'targetNode' }),
}));
