import { NodeEntity } from '@application/entities/node.entity';
import { and, eq, inArray } from 'drizzle-orm';
import { Injectable } from 'src/kernel/decorators/injectable';
import { db, Transaction } from '../db';
import {
  fileNodeData,
  generationNodeData,
  imageToVideoNodeData,
  motionControlNodeData,
  nodes,
  promptNodeData,
  removeBgNodeData,
  textToImageNodeData,
  upscaleNodeData,
} from '../schema';

const WITH_ALL_DATA = {
  promptData: true,
  fileData: true,
  generationData: true,
  textToImageData: true,
  upscaleData: true,
  removeBgData: true,
  imageToVideoData: true,
  motionControlData: true,
} as const;

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
      with: WITH_ALL_DATA,
    });

    if (!result) return null;
    return this.toEntity(result);
  }

  async findNodesByIds(params: { flowId: string; nodeIds: string[] }): Promise<NodeEntity[]> {
    if (params.nodeIds.length === 0) return [];

    const results = await db.query.nodes.findMany({
      where: and(eq(nodes.flowId, params.flowId), inArray(nodes.id, params.nodeIds)),
      with: WITH_ALL_DATA,
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
        nodeType: node.attrs.nodeType as typeof nodes.$inferInsert.nodeType,
        positionX: node.attrs.position.x,
        positionY: node.attrs.position.y,
        isExecuted: node.attrs.isExecuted,
        updatedAt: node.attrs.updatedAt,
      })
      .where(eq(nodes.id, node.attrs.id));

    await this.updateData(node, executor);
  }

  async delete(params: { flowId: string; nodeId: string }): Promise<void> {
    await db.delete(nodes).where(and(eq(nodes.id, params.nodeId), eq(nodes.flowId, params.flowId)));
  }

  private async insertData(node: NodeEntity, executor: Transaction | typeof db): Promise<void> {
    if (node.isPrompt()) {
      await executor.insert(promptNodeData).values({
        nodeId: node.attrs.id,
        prompt: node.attrs.data.prompt,
      });
    } else if (node.isImage() || node.isVideo()) {
      await executor.insert(fileNodeData).values({
        nodeId: node.attrs.id,
        key: node.attrs.data.key,
        inputType: node.attrs.data.inputType,
        duration: node.attrs.data.duration,
        fps: node.attrs.data.fps,
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
        consumedCredits: d.consumedCredits,
      });
    } else if (node.isTextToImage()) {
      const d = node.attrs.data;
      await executor.insert(textToImageNodeData).values({
        nodeId: node.attrs.id,
        model: d.model,
        status: d.status,
        attempts: d.attempts,
        outputNodeId: d.outputNodeId,
        aspectRatio: d.aspectRatio,
        quality: d.quality,
        consumedCredits: d.consumedCredits,
      });
    } else if (node.isUpscale()) {
      const d = node.attrs.data;
      await executor.insert(upscaleNodeData).values({
        nodeId: node.attrs.id,
        model: d.model,
        status: d.status,
        attempts: d.attempts,
        outputNodeId: d.outputNodeId,
        scale: d.scale,
        consumedCredits: d.consumedCredits,
      });
    } else if (node.isRemoveBg()) {
      const d = node.attrs.data;
      await executor.insert(removeBgNodeData).values({
        nodeId: node.attrs.id,
        model: d.model,
        status: d.status,
        attempts: d.attempts,
        outputNodeId: d.outputNodeId,
        consumedCredits: d.consumedCredits,
      });
    } else if (node.isImageToVideo()) {
      const d = node.attrs.data;
      await executor.insert(imageToVideoNodeData).values({
        nodeId: node.attrs.id,
        model: d.model,
        status: d.status,
        attempts: d.attempts,
        outputNodeId: d.outputNodeId,
        tier: d.tier,
        duration: d.duration,
        resolution: d.resolution,
        aspectRatio: d.aspectRatio,
        generateAudio: d.generateAudio,
        consumedCredits: d.consumedCredits,
      });
    } else if (node.isMotionControl()) {
      const d = node.attrs.data;
      await executor.insert(motionControlNodeData).values({
        nodeId: node.attrs.id,
        model: d.model,
        status: d.status,
        attempts: d.attempts,
        outputNodeId: d.outputNodeId,
        characterOrientation: d.characterOrientation,
        keepOriginalSound: d.keepOriginalSound,
        consumedCredits: d.consumedCredits,
      });
    }
  }

  private async updateData(node: NodeEntity, executor: Transaction): Promise<void> {
    if (node.isPrompt()) {
      await executor
        .update(promptNodeData)
        .set({
          prompt: node.attrs.data.prompt,
        })
        .where(eq(promptNodeData.nodeId, node.attrs.id));
    } else if (node.isImage() || node.isVideo()) {
      await executor
        .update(fileNodeData)
        .set({
          key: node.attrs.data.key,
          inputType: node.attrs.data.inputType,
          duration: node.attrs.data.duration,
          fps: node.attrs.data.fps,
        })
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
          consumedCredits: d.consumedCredits,
        })
        .where(eq(generationNodeData.nodeId, node.attrs.id));
    } else if (node.isTextToImage()) {
      const d = node.attrs.data;
      await executor
        .update(textToImageNodeData)
        .set({
          status: d.status,
          attempts: d.attempts,
          outputNodeId: d.outputNodeId,
          aspectRatio: d.aspectRatio,
          quality: d.quality,
          consumedCredits: d.consumedCredits,
        })
        .where(eq(textToImageNodeData.nodeId, node.attrs.id));
    } else if (node.isUpscale()) {
      const d = node.attrs.data;
      await executor
        .update(upscaleNodeData)
        .set({
          status: d.status,
          attempts: d.attempts,
          outputNodeId: d.outputNodeId,
          scale: d.scale,
          consumedCredits: d.consumedCredits,
        })
        .where(eq(upscaleNodeData.nodeId, node.attrs.id));
    } else if (node.isRemoveBg()) {
      const d = node.attrs.data;
      await executor
        .update(removeBgNodeData)
        .set({
          status: d.status,
          attempts: d.attempts,
          outputNodeId: d.outputNodeId,
          consumedCredits: d.consumedCredits,
        })
        .where(eq(removeBgNodeData.nodeId, node.attrs.id));
    } else if (node.isImageToVideo()) {
      const d = node.attrs.data;
      await executor
        .update(imageToVideoNodeData)
        .set({
          model: d.model,
          status: d.status,
          attempts: d.attempts,
          outputNodeId: d.outputNodeId,
          tier: d.tier,
          duration: d.duration,
          resolution: d.resolution,
          aspectRatio: d.aspectRatio,
          generateAudio: d.generateAudio,
          consumedCredits: d.consumedCredits,
        })
        .where(eq(imageToVideoNodeData.nodeId, node.attrs.id));
    } else if (node.isMotionControl()) {
      const d = node.attrs.data;
      await executor
        .update(motionControlNodeData)
        .set({
          model: d.model,
          status: d.status,
          attempts: d.attempts,
          outputNodeId: d.outputNodeId,
          characterOrientation: d.characterOrientation,
          keepOriginalSound: d.keepOriginalSound,
          consumedCredits: d.consumedCredits,
        })
        .where(eq(motionControlNodeData.nodeId, node.attrs.id));
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
      createdAt: entity.attrs.createdAt,
      updatedAt: entity.attrs.updatedAt,
    };
  }

  private toEntity(row: any): NodeEntity {
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
    } else if (nodeType === NodeEntity.NodeType.GENERATION_IMAGE && row.generationData) {
      const g = row.generationData;
      data = {
        model: g.model,
        status: g.status,
        attempts: g.attempts,
        outputNodeId: g.outputNodeId,
        aspectRatio: g.aspectRatio,
        quality: g.quality,
        consumedCredits: g.consumedCredits ?? undefined,
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
      };
    } else if (nodeType === NodeEntity.NodeType.GENERATION_REMOVE_BG && row.removeBgData) {
      const r = row.removeBgData;
      data = {
        model: r.model,
        status: r.status,
        attempts: r.attempts,
        outputNodeId: r.outputNodeId,
        consumedCredits: r.consumedCredits ?? undefined,
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
}
