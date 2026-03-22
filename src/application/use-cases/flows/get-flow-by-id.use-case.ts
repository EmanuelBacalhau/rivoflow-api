import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { EdgeEntity } from '@application/entities/edge.entity';
import { FlowEntity } from '@application/entities/flow.entity';
import { NodeEntity } from '@application/entities/node.entity';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { CreditService } from '@application/services/credit.service';
import { FlowDrizzleRepository } from '@infra/database/drizzle/repositories/flow-drizzle.repository';
import { FileStorageGateway } from '@infra/gateways/aws/file-storage.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

interface GetFlowByIdUseCaseInput {
  flowId: string;
  accountId: string;
}

type NodeDataOutput = Omit<NodeEntity.AllAttributes['data'], 'model'> & {
  imageUrl?: string;
  creditsRequired?: number;
};

type NodeOutput = Omit<NodeEntity.AllAttributes, 'data'> & {
  data: NodeDataOutput;
};

interface GetFlowByIdUseCaseOutput {
  flow: Omit<FlowEntity.AllAttributes, 'nodes' | 'edges'>;
  nodes: NodeOutput[];
  edges: EdgeEntity.AllAttributes[];
}

@Injectable()
export class GetFlowByIdUseCase
  implements IUseCase<GetFlowByIdUseCaseInput, GetFlowByIdUseCaseOutput>
{
  constructor(
    private readonly flowRepository: FlowDrizzleRepository,
    private readonly fileStorageGateway: FileStorageGateway,
    private readonly creditService: CreditService,
  ) {}

  async execute(params: GetFlowByIdUseCaseInput): Promise<GetFlowByIdUseCaseOutput> {
    const flow = await this.flowRepository.findFlowAndNodesAndEdgesById(params.flowId);

    if (!flow) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Flow not found');
    }

    if (flow.attrs.accountId !== params.accountId) {
      throw new ApplicationError(ErrorCode.FORBIDDEN);
    }

    const edges = flow.attrs.edges.map((edge) => edge.attrs);

    const allNodes = flow.attrs.nodes;
    const allEdges = flow.attrs.edges;

    const nodes = await Promise.all(
      allNodes.map((node) => this.transformNode(node, allNodes, allEdges)),
    );

    return {
      flow: {
        id: flow.attrs.id,
        title: flow.attrs.title,
        accountId: flow.attrs.accountId,
        createdAt: flow.attrs.createdAt,
        updatedAt: flow.attrs.updatedAt,
      },
      nodes,
      edges,
    };
  }

  private async transformNode(node: NodeEntity, allNodes: NodeEntity[], allEdges: EdgeEntity[]) {
    if (node.isAnyGeneration()) {
      const creditsRequired = await this.calculateCreditsForNode(node, allNodes, allEdges);
      const { model, ...restData } = node.attrs.data as NodeEntity.GenerationData;

      return {
        ...node.attrs,
        data: {
          ...restData,
          creditsRequired,
        },
      };
    }

    if (node.isImage() && node.attrs.data.key) {
      const imageUrl = this.fileStorageGateway.generateCdnUrl(node.attrs.data.key);

      return {
        ...node.attrs,
        data: {
          ...node.attrs.data,
          imageUrl,
        },
      };
    }

    if ((node.isVideo() || node.isVideo()) && node.attrs.data.key) {
      const videoUrl = this.fileStorageGateway.generateCdnUrl(node.attrs.data.key);

      return {
        ...node.attrs,
        data: {
          ...node.attrs.data,
          videoUrl,
        },
      };
    }

    return {
      ...node.attrs,
    };
  }

  private async calculateCreditsForNode(
    node: NodeEntity,
    allNodes: NodeEntity[],
    allEdges: EdgeEntity[],
  ): Promise<number> {
    if (node.isGeneration()) {
      const { creditsRequired } = await this.creditService.calculateForGenerationNode({
        generatorNodeData: node.attrs.data,
      });
      return creditsRequired;
    }
    if (node.isTextToImage()) {
      const { creditsRequired } = await this.creditService.calculateForTextToImageNode({
        generatorNodeData: node.attrs.data,
      });
      return creditsRequired;
    }
    if (node.isUpscale()) {
      const { creditsRequired } = await this.creditService.calculateForUpscaleNode({
        generatorNodeData: node.attrs.data,
      });
      return creditsRequired;
    }
    if (node.isRemoveBg()) {
      const { creditsRequired } = await this.creditService.calculateForRemoveBgNode();
      return creditsRequired;
    }
    if (node.isImageToVideo()) {
      const { creditsRequired } = await this.creditService.calculateForImageToVideoNode({
        tier: node.attrs.data.tier,
        duration: node.attrs.data.duration,
        resolution: node.attrs.data.resolution,
        generateAudio: node.attrs.data.generateAudio,
      });
      return creditsRequired;
    }
    if (node.isMotionControl()) {
      const inputEdges = allEdges.filter((e) => e.attrs.targetNodeId === node.attrs.id);
      const inputNodeIds = inputEdges.map((e) => e.attrs.sourceNodeId);
      const videoNode = allNodes.find((n) => inputNodeIds.includes(n.attrs.id) && n.isVideo());
      const duration = videoNode?.getVideoDuration() ?? 0;
      if (!duration || duration <= 0) return 0;
      const { creditsRequired } = await this.creditService.calculateForMotionControlNode({
        duration,
        keepOriginalSound: node.attrs.data.keepOriginalSound,
      });
      return creditsRequired;
    }
    return 0;
  }
}
