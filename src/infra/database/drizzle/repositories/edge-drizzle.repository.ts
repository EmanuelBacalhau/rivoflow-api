import { EdgeEntity } from '@application/entities/edge.entity';
import { and, eq } from 'drizzle-orm';
import { Injectable } from 'src/kernel/decorators/injectable';
import { db, Transaction } from '../db';
import { edges } from '../schema';

@Injectable()
export class EdgeDrizzleRepository {
  async findById(params: { flowId: string; edgeId: string }): Promise<EdgeEntity | null> {
    const row = await db
      .select()
      .from(edges)
      .where(and(eq(edges.id, params.edgeId), eq(edges.flowId, params.flowId)))
      .limit(1);

    if (!row[0]) return null;
    return this.toEntity(row[0]);
  }

  async save(edge: EdgeEntity, tx?: Transaction): Promise<void> {
    const conn = tx ?? db;
    await conn.insert(edges).values(this.toRow(edge));
  }

  async findByTargetNodeId(params: {
    flowId: string;
    targetNodeId: string;
  }): Promise<EdgeEntity[]> {
    const rows = await db
      .select()
      .from(edges)
      .where(and(eq(edges.flowId, params.flowId), eq(edges.targetNodeId, params.targetNodeId)));

    return rows.map((row) => this.toEntity(row));
  }

  async delete(params: { flowId: string; edgeId: string }): Promise<void> {
    await db.delete(edges).where(and(eq(edges.id, params.edgeId), eq(edges.flowId, params.flowId)));
  }

  private toRow(entity: EdgeEntity): typeof edges.$inferInsert {
    return {
      id: entity.attrs.id,
      flowId: entity.attrs.flowId,
      sourceNodeId: entity.attrs.sourceNodeId,
      targetNodeId: entity.attrs.targetNodeId,
      createdAt: entity.attrs.createdAt,
      updatedAt: entity.attrs.updatedAt,
    };
  }

  private toEntity(row: typeof edges.$inferSelect): EdgeEntity {
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
