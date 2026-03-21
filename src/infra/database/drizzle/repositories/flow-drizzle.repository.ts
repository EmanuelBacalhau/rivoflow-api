import { EdgeEntity } from '@application/entities/edge.entity';
import { FlowEntity } from '@application/entities/flow.entity';
import { NodeEntity } from '@application/entities/node.entity';
import { desc, eq } from 'drizzle-orm';
import { Injectable } from 'src/kernel/decorators/injectable';
import { db, Transaction } from '../db';
import { edges, flows, nodes } from '../schema';

@Injectable()
export class FlowDrizzleRepository {
  async findById(id: string): Promise<FlowEntity | null> {
    const row = await db.select().from(flows).where(eq(flows.id, id)).limit(1);
    if (!row[0]) return null;
    return this.toEntity(row[0]);
  }

  async findFlowAndNodesAndEdgesById(id: string): Promise<FlowEntity | null> {
    const result = await db.query.flows.findFirst({
      where: eq(flows.id, id),
      with: {
        nodes: true,
        edges: true,
      },
    });

    if (!result) return null;

    const entity = this.toEntity(result);

    entity.nodes = result.nodes.map((n) => this.toNodeEntity(n));
    entity.edges = result.edges.map((e) => this.toEdgeEntity(e));

    return entity;
  }

  async findByAccountId(accountId: string): Promise<FlowEntity[]> {
    const rows = await db
      .select()
      .from(flows)
      .where(eq(flows.accountId, accountId))
      .orderBy(desc(flows.createdAt));

    return rows.map((row) => this.toEntity(row));
  }

  async create(flow: FlowEntity): Promise<void> {
    await db.insert(flows).values(this.toRow(flow));
  }

  async update(flow: FlowEntity, tx?: Transaction): Promise<void> {
    const executor = tx ?? db;
    await executor
      .update(flows)
      .set({
        title: flow.attrs.title,
        updatedAt: flow.attrs.updatedAt,
      })
      .where(eq(flows.id, flow.attrs.id));
  }

  async delete(id: string): Promise<void> {
    await db.delete(flows).where(eq(flows.id, id));
  }

  private toRow(entity: FlowEntity) {
    return {
      id: entity.attrs.id,
      title: entity.attrs.title,
      accountId: entity.attrs.accountId,
      createdAt: entity.attrs.createdAt,
      updatedAt: entity.attrs.updatedAt,
    };
  }

  private toEntity(row: typeof flows.$inferSelect): FlowEntity {
    return new FlowEntity({
      id: row.id,
      title: row.title,
      accountId: row.accountId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toNodeEntity(row: typeof nodes.$inferSelect): NodeEntity {
    return new NodeEntity({
      id: row.id,
      flowId: row.flowId,
      position: { x: row.positionX, y: row.positionY },
      isExecuted: row.isExecuted,
      totalTokens: row.totalTokens,
      consumedCredits: row.consumedCredits ?? undefined,
      data: row.data as NodeEntity.NodeData,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toEdgeEntity(row: typeof edges.$inferSelect): EdgeEntity {
    return new EdgeEntity({
      id: row.id,
      flowId: row.flowId,
      sourceNodeId: row.sourceNodeId,
      targetNodeId: row.targetNodeId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
