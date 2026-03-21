import { NodeEntity } from '@application/entities/node.entity';
import { and, eq, inArray } from 'drizzle-orm';
import { Injectable } from 'src/kernel/decorators/injectable';
import { db, Transaction } from '../db';
import { nodes } from '../schema';

@Injectable()
export class NodeDrizzleRepository {
  async save(node: NodeEntity, tx?: Transaction): Promise<void> {
    const executor = tx ?? db;
    await executor.insert(nodes).values(this.toRow(node));
  }

  async findById(nodeId: string, flowId: string): Promise<NodeEntity | null> {
    const row = await db
      .select()
      .from(nodes)
      .where(and(eq(nodes.id, nodeId), eq(nodes.flowId, flowId)))
      .limit(1);

    if (!row[0]) return null;
    return this.toEntity(row[0]);
  }

  async findNodesByIds(params: { flowId: string; nodeIds: string[] }): Promise<NodeEntity[]> {
    if (params.nodeIds.length === 0) return [];

    const rows = await db
      .select()
      .from(nodes)
      .where(and(eq(nodes.flowId, params.flowId), inArray(nodes.id, params.nodeIds)));

    return rows.map((row) => this.toEntity(row));
  }

  async update(node: NodeEntity, tx?: Transaction): Promise<void> {
    const executor = tx ?? db;
    await executor
      .update(nodes)
      .set({
        positionX: node.attrs.position.x,
        positionY: node.attrs.position.y,
        isExecuted: node.attrs.isExecuted,
        totalTokens: node.attrs.totalTokens,
        consumedCredits: node.attrs.consumedCredits,
        nodeType: node.attrs.data.type as typeof nodes.$inferInsert.nodeType,
        data: node.attrs.data,
        updatedAt: node.attrs.updatedAt,
      })
      .where(eq(nodes.id, node.attrs.id));
  }

  async delete(params: { flowId: string; nodeId: string }): Promise<void> {
    await db
      .delete(nodes)
      .where(and(eq(nodes.id, params.nodeId), eq(nodes.flowId, params.flowId)));
  }

  private toRow(entity: NodeEntity): typeof nodes.$inferInsert {
    return {
      id: entity.attrs.id,
      flowId: entity.attrs.flowId,
      positionX: entity.attrs.position.x,
      positionY: entity.attrs.position.y,
      isExecuted: entity.attrs.isExecuted,
      totalTokens: entity.attrs.totalTokens,
      consumedCredits: entity.attrs.consumedCredits,
      nodeType: entity.attrs.data.type as typeof nodes.$inferInsert.nodeType,
      data: entity.attrs.data,
      createdAt: entity.attrs.createdAt,
      updatedAt: entity.attrs.updatedAt,
    };
  }

  private toEntity(row: typeof nodes.$inferSelect): NodeEntity {
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
}
