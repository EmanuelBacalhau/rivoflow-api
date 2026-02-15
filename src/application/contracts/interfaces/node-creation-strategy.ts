import { NodeEntity } from '@application/entities/node.entity';

export type PromptInputPayload = {
  prompt: string;
};

export type FileInputPayload = {};

export type GenerationInputPayload = {
  model: string;
  parameters: Record<string, unknown>;
};

export type NodeInputPayload = PromptInputPayload | FileInputPayload | GenerationInputPayload;

export interface CreateNodeUseCaseInput {
  flowId: string;
  type: NodeEntity.NodeType;
  position: NodeEntity.Position;
}

export interface CreateNodeUseCaseOutput {
  node: NodeEntity.AllAttributes & {
    data: NodeEntity.NodeData & {
      fileUrl?: string;
    };
  };
}

export interface INodeCreationStrategy {
  prepareData(): NodeEntity.NodeData;
}
