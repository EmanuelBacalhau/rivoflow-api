import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Enums
export const accountRoleEnum = pgEnum('account_role', [
  'USER',
  'ADMIN',
]);
export const nodeTypeEnum = pgEnum('node_type', [
  'PROMPT',
  'IMAGE',
  'GENERATION_IMAGE',
  'RESULT_IMAGE',
]);

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
  accountId: text('account_id')
    .notNull()
    .unique()
    .references(() => accounts.id, {
      onDelete: 'cascade',
    }),
  balance: integer('balance').notNull().default(0),
  lifetimeDeposited: integer('lifetime_deposited').notNull().default(0),
  lifetimeSpent: integer('lifetime_spent').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const flows = pgTable('flows', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id, {
      onDelete: 'cascade',
    }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const nodes = pgTable('nodes', {
  id: text('id').primaryKey(),
  flowId: text('flow_id')
    .notNull()
    .references(() => flows.id, {
      onDelete: 'cascade',
    }),
  positionX: real('position_x').notNull(),
  positionY: real('position_y').notNull(),
  isExecuted: boolean('is_executed').notNull().default(false),
  totalTokens: integer('total_tokens').notNull().default(0),
  consumedCredits: integer('consumed_credits'),
  nodeType: nodeTypeEnum('node_type').notNull(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const edges = pgTable('edges', {
  id: text('id').primaryKey(),
  flowId: text('flow_id')
    .notNull()
    .references(() => flows.id, {
      onDelete: 'cascade',
    }),
  sourceNodeId: text('source_node_id')
    .notNull()
    .references(() => nodes.id, {
      onDelete: 'cascade',
    }),
  targetNodeId: text('target_node_id')
    .notNull()
    .references(() => nodes.id, {
      onDelete: 'cascade',
    }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations
export const accountsRelations = relations(accounts, ({ one, many }) => ({
  balance: one(accountBalances, {
    fields: [
      accounts.id,
    ],
    references: [
      accountBalances.accountId,
    ],
  }),
  flows: many(flows),
}));

export const accountBalancesRelations = relations(accountBalances, ({ one }) => ({
  account: one(accounts, {
    fields: [
      accountBalances.accountId,
    ],
    references: [
      accounts.id,
    ],
  }),
}));

export const flowsRelations = relations(flows, ({ one, many }) => ({
  account: one(accounts, {
    fields: [
      flows.accountId,
    ],
    references: [
      accounts.id,
    ],
  }),
  nodes: many(nodes),
  edges: many(edges),
}));

export const nodesRelations = relations(nodes, ({ one }) => ({
  flow: one(flows, {
    fields: [
      nodes.flowId,
    ],
    references: [
      flows.id,
    ],
  }),
}));

export const edgesRelations = relations(edges, ({ one }) => ({
  flow: one(flows, {
    fields: [
      edges.flowId,
    ],
    references: [
      flows.id,
    ],
  }),
  sourceNode: one(nodes, {
    fields: [
      edges.sourceNodeId,
    ],
    references: [
      nodes.id,
    ],
    relationName: 'sourceNode',
  }),
  targetNode: one(nodes, {
    fields: [
      edges.targetNodeId,
    ],
    references: [
      nodes.id,
    ],
    relationName: 'targetNode',
  }),
}));
