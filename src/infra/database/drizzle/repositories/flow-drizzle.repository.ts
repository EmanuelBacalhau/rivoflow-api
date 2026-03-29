import { EdgeEntity } from '@application/entities/edge.entity';
import { FlowEntity } from '@application/entities/flow.entity';
import { NodeEntity } from '@application/entities/node.entity';
import { desc, eq } from 'drizzle-orm';
import { Injectable } from 'src/kernel/decorators/injectable';
import { db, Transaction } from '../db';
import { edges, flows } from '../schema';

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
        nodes: {
          with: {
            promptData: true,
            fileData: true,
            generationData: true,
            textToImageData: true,
            upscaleData: true,
            removeBgData: true,
            imageToVideoData: true,
            motionControlData: true,
          },
        },
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

  private toNodeEntity(row: any): NodeEntity {
    const nodeType = row.nodeType as NodeEntity.NodeType;
    let data: NodeEntity.Attributes['data'];

    if (nodeType === NodeEntity.NodeType.PROMPT && row.promptData) {
      data = {
        prompt: row.promptData.prompt,
      };
    } else if (
      (nodeType === NodeEntity.NodeType.IMAGE ||
        nodeType === NodeEntity.NodeType.VIDEO ||
        nodeType === NodeEntity.NodeType.RESULT_IMAGE ||
        nodeType === NodeEntity.NodeType.RESULT_VIDEO) &&
      row.fileData
    ) {
      data = {
        key: row.fileData.key,
        inputType: row.fileData.inputType,
        duration: row.fileData.duration,
        fps: row.fileData.fps,
      };
    } else if (nodeType === NodeEntity.NodeType.GENERATION_IMAGE_EDIT && row.generationData) {
      const g = row.generationData;
      data = {
        model: g.model,
        status: g.status,
        attempts: g.attempts,
        outputNodeId: g.outputNodeId,
        aspectRatio: g.aspectRatio,
        quality: g.quality,
        consumedCredits: g.consumedCredits ?? undefined,
        falRequestId: g.falRequestId,
      };
    } else if (nodeType === NodeEntity.NodeType.GENERATION_TEXT_TO_IMAGE && row.textToImageData) {
      const t = row.textToImageData;
      data = {
        model: t.model,
        status: t.status,
        attempts: t.attempts,
        outputNodeId: t.outputNodeId,
        aspectRatio: t.aspectRatio,
        quality: t.quality,
        consumedCredits: t.consumedCredits ?? undefined,
        falRequestId: t.falRequestId,
      };
    } else if (nodeType === NodeEntity.NodeType.GENERATION_UPSCALE && row.upscaleData) {
      const u = row.upscaleData;
      data = {
        model: u.model,
        status: u.status,
        attempts: u.attempts,
        outputNodeId: u.outputNodeId,
        scale: u.scale,
        consumedCredits: u.consumedCredits ?? undefined,
        falRequestId: u.falRequestId,
      };
    } else if (nodeType === NodeEntity.NodeType.GENERATION_REMOVE_BG && row.removeBgData) {
      const r = row.removeBgData;
      data = {
        model: r.model,
        status: r.status,
        attempts: r.attempts,
        outputNodeId: r.outputNodeId,
        consumedCredits: r.consumedCredits ?? undefined,
        falRequestId: r.falRequestId,
      };
    } else if (nodeType === NodeEntity.NodeType.GENERATION_IMAGE_TO_VIDEO && row.imageToVideoData) {
      const v = row.imageToVideoData;
      data = {
        model: v.model,
        status: v.status,
        attempts: v.attempts,
        outputNodeId: v.outputNodeId,
        tier: v.tier,
        duration: v.duration,
        resolution: v.resolution,
        aspectRatio: v.aspectRatio,
        generateAudio: v.generateAudio,
        consumedCredits: v.consumedCredits ?? undefined,
        falRequestId: v.falRequestId,
      };
    } else if (
      nodeType === NodeEntity.NodeType.GENERATION_MOTION_CONTROL &&
      row.motionControlData
    ) {
      const mc = row.motionControlData;
      data = {
        model: mc.model,
        status: mc.status,
        attempts: mc.attempts,
        outputNodeId: mc.outputNodeId,
        characterOrientation: mc.characterOrientation,
        keepOriginalSound: mc.keepOriginalSound,
        consumedCredits: mc.consumedCredits ?? undefined,
        falRequestId: mc.falRequestId,
      };
    } else {
      data = {};
    }

    return new NodeEntity({
      id: row.id,
      flowId: row.flowId,
      nodeType,
      position: {
        x: row.positionX,
        y: row.positionY,
      },
      isExecuted: row.isExecuted,
      data,
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
