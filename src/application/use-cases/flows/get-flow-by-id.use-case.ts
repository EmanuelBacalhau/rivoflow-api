import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { EdgeEntity } from '@application/entities/edge.entity';
import { FlowEntity } from '@application/entities/flow.entity';
import { NodeEntity } from '@application/entities/node.entity';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { FlowDynamoRepository } from '@infra/database/dynamo/repositories/flow-dynamo.repository';
import { FileStorageGateway } from '@infra/gateways/aws/file-storage.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';
import { calculateCreditsRequired } from 'src/shared/utils/credit-calculator';

interface GetFlowByIdUseCaseInput {
  flowId: string;
}

type NodeDataOutput = Omit<NodeEntity.AllAttributes['data'], 'totalTokens'> & {
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
    private readonly flowRepository: FlowDynamoRepository,
    private readonly fileStorageGateway: FileStorageGateway,
  ) {}

  async execute(params: GetFlowByIdUseCaseInput): Promise<GetFlowByIdUseCaseOutput> {
    const flow = await this.flowRepository.findFlowAndNodesAndEdgesById(params.flowId);

    if (!flow) {
      throw new ResourceNotFoundError('Flow not found');
    }

    const edges = flow.attrs.edges.map((edge) => edge.attrs);

    const nodes = flow.attrs.nodes.map((node) => this.transformNode(node, flow.attrs.nodes, edges));

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

  private transformNode(
    node: NodeEntity,
    allNodes: NodeEntity[],
    edges: EdgeEntity.AllAttributes[],
  ) {
    const { totalTokens, ...nodeData } = node.attrs.data;

    if (node.attrs.data.type === NodeEntity.NodeType.GENERATION_IMAGE) {
      const genData = node.attrs.data as NodeEntity.NodeDataGenerationImage;

      const inputNodeIds = edges
        .filter((e) => e.targetNodeId === node.attrs.id)
        .map((e) => e.sourceNodeId);

      const inputNodes = allNodes.filter((n) => inputNodeIds.includes(n.attrs.id));

      const promptTokens = inputNodes.reduce((acc, n) => {
        if (n.attrs.data.type === NodeEntity.NodeType.PROMPT && n.attrs.data.prompt) {
          return acc + (n.attrs.data as NodeEntity.NodeDataPrompt).totalTokens;
        }
        return acc;
      }, 0);

      const imageCount = inputNodes.filter(
        (n) =>
          (n.attrs.data.type === NodeEntity.NodeType.IMAGE ||
            n.attrs.data.type === NodeEntity.NodeType.RESULT_IMAGE) &&
          n.attrs.data.key,
      ).length;

      const creditsRequired =
        promptTokens === 0 && imageCount === 0
          ? 0
          : calculateCreditsRequired({
              promptTokens,
              imageTokens: imageCount,
              quality: genData.parameters.quality,
            });

      return {
        ...node.attrs,
        data: {
          ...nodeData,
          creditsRequired,
        },
      };
    }

    if ('key' in node.attrs.data && node.attrs.data.key) {
      const imageUrl = this.fileStorageGateway.generateCdnUrl(node.attrs.data.key);

      return {
        ...node.attrs,
        data: {
          ...nodeData,
          imageUrl,
        },
      };
    }

    return {
      ...node.attrs,
      data: nodeData,
    };
  }
}
