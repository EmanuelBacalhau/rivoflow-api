import { NodeEntity } from '@application/entities/node.entity';
import { and, eq, inArray } from 'drizzle-orm';
import { Injectable } from 'src/kernel/decorators/injectable';
import { db, Transaction } from '../db';
import { fileNodeData, generationNodeData, nodes, promptNodeData } from '../schema';

@Injectable()
export class NodeDrizzleRepository {
  async save(node: NodeEntity, tx?: Transaction): Promise<void> {
    const executor = tx ?? db;

    await executor.insert(nodes).values(this.toNodeRow(node));
    await this.insertData(node, executor);
  }

  async findById(nodeId: string, flowId: string): Promise<NodeEntity | null> {
    const result = await db.query.nodes.findFirst({
      where: and(eq(nodes.id, nodeId), eq(nodes.flowId, flowId)),
      with: { promptData: true, fileData: true, generationData: true },
    });

    if (!result) return null;
    return this.toEntity(result);
  }

  async findNodesByIds(params: { flowId: string; nodeIds: string[] }): Promise<NodeEntity[]> {
    if (params.nodeIds.length === 0) return [];

    const results = await db.query.nodes.findMany({
      where: and(eq(nodes.flowId, params.flowId), inArray(nodes.id, params.nodeIds)),
      with: { promptData: true, fileData: true, generationData: true },
    });

    return results.map((r) => this.toEntity(r));
  }

  async update(node: NodeEntity, tx?: Transaction): Promise<void> {
    if (tx) {
      await this.performUpdate(node, tx);
    } else {
      await db.transaction(async (innerTx) => {
        await this.performUpdate(node, innerTx);
      });
    }
  }

  private async performUpdate(node: NodeEntity, executor: Transaction): Promise<void> {
    await executor
      .update(nodes)
      .set({
        positionX: node.attrs.position.x,
        positionY: node.attrs.position.y,
        isExecuted: node.attrs.isExecuted,
        totalTokens: node.attrs.totalTokens,
        consumedCredits: node.attrs.consumedCredits,
        updatedAt: node.attrs.updatedAt,
      })
      .where(eq(nodes.id, node.attrs.id));

    await this.updateData(node, executor);
  }

  async delete(params: { flowId: string; nodeId: string }): Promise<void> {
    await db
      .delete(nodes)
      .where(and(eq(nodes.id, params.nodeId), eq(nodes.flowId, params.flowId)));
  }

  private async insertData(node: NodeEntity, executor: Transaction | typeof db): Promise<void> {
    if (node.isPrompt()) {
      await executor.insert(promptNodeData).values({
        nodeId: node.attrs.id,
        prompt: node.attrs.data.prompt,
      });
    } else if (node.isImage()) {
      await executor.insert(fileNodeData).values({
        nodeId: node.attrs.id,
        key: node.attrs.data.key,
        inputType: node.attrs.data.inputType,
      });
    } else if (node.isGeneration()) {
      const d = node.attrs.data;
      await executor.insert(generationNodeData).values({
        nodeId: node.attrs.id,
        model: d.model,
        status: d.status,
        attempts: d.attempts,
        outputNodeId: d.outputNodeId,
        aspectRatio: d.aspectRatio,
        quality: d.quality,
      });
    }
  }

  private async updateData(node: NodeEntity, executor: Transaction): Promise<void> {
    if (node.isPrompt()) {
      await executor
        .update(promptNodeData)
        .set({ prompt: node.attrs.data.prompt })
        .where(eq(promptNodeData.nodeId, node.attrs.id));
    } else if (node.isImage()) {
      await executor
        .update(fileNodeData)
        .set({ key: node.attrs.data.key, inputType: node.attrs.data.inputType })
        .where(eq(fileNodeData.nodeId, node.attrs.id));
    } else if (node.isGeneration()) {
      const d = node.attrs.data;
      await executor
        .update(generationNodeData)
        .set({
          status: d.status,
          attempts: d.attempts,
          outputNodeId: d.outputNodeId,
          aspectRatio: d.aspectRatio,
          quality: d.quality,
        })
        .where(eq(generationNodeData.nodeId, node.attrs.id));
    }
  }

  private toNodeRow(entity: NodeEntity): typeof nodes.$inferInsert {
    return {
      id: entity.attrs.id,
      flowId: entity.attrs.flowId,
      nodeType: entity.attrs.nodeType as typeof nodes.$inferInsert.nodeType,
      positionX: entity.attrs.position.x,
      positionY: entity.attrs.position.y,
      isExecuted: entity.attrs.isExecuted,
      totalTokens: entity.attrs.totalTokens,
      consumedCredits: entity.attrs.consumedCredits,
      createdAt: entity.attrs.createdAt,
      updatedAt: entity.attrs.updatedAt,
    };
  }

  private toEntity(row: any): NodeEntity {
    const nodeType = row.nodeType as NodeEntity.NodeType;
    let data: NodeEntity.PromptData | NodeEntity.FileData | NodeEntity.GenerationData;

    if (nodeType === NodeEntity.NodeType.PROMPT && row.promptData) {
      data = { prompt: row.promptData.prompt };
    } else if (
      (nodeType === NodeEntity.NodeType.IMAGE || nodeType === NodeEntity.NodeType.RESULT_IMAGE) &&
      row.fileData
    ) {
      data = { key: row.fileData.key, inputType: row.fileData.inputType };
    } else if (nodeType === NodeEntity.NodeType.GENERATION_IMAGE && row.generationData) {
      const g = row.generationData;
      data = {
        model: g.model,
        status: g.status,
        attempts: g.attempts,
        outputNodeId: g.outputNodeId,
        aspectRatio: g.aspectRatio,
        quality: g.quality,
      };
    } else {
      data = {};
    }

    return new NodeEntity({
      id: row.id,
      flowId: row.flowId,
      nodeType,
      position: { x: row.positionX, y: row.positionY },
      isExecuted: row.isExecuted,
      totalTokens: row.totalTokens,
      consumedCredits: row.consumedCredits ?? undefined,
      data,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
