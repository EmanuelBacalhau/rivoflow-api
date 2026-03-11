import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { EdgeEntity } from '@application/entities/edge.entity';
import { FlowEntity } from '@application/entities/flow.entity';
import { NodeEntity } from '@application/entities/node.entity';
import { ForbiddenError } from '@application/errors/application/forbidden.error';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { CreditCalculationService } from '@application/services/credit-calculation.service';
import { FlowDynamoRepository } from '@infra/database/dynamo/repositories/flow-dynamo.repository';
import { FileStorageGateway } from '@infra/gateways/aws/file-storage.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

interface GetFlowByIdUseCaseInput {
  flowId: string;
  accountId: string;
}

type NodeDataOutput = Omit<NodeEntity.AllAttributes['data'], 'totalTokens' | 'model'> & {
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
    private readonly creditCalculationService: CreditCalculationService,
  ) {}

  async execute(params: GetFlowByIdUseCaseInput): Promise<GetFlowByIdUseCaseOutput> {
    const flow = await this.flowRepository.findFlowAndNodesAndEdgesById(params.flowId);

    if (!flow) {
      throw new ResourceNotFoundError('Flow not found');
    }

    const isThisFlowMe = flow.attrs.accountId === params.accountId;

    if (!isThisFlowMe) {
      throw new ForbiddenError();
    }

    const edges = flow.attrs.edges.map((edge) => edge.attrs);

    const nodes = await Promise.all(
      flow.attrs.nodes.map((node) => this.transformNode(node, flow.attrs.nodes, edges)),
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

  private async transformNode(
    node: NodeEntity,
    allNodes: NodeEntity[],
    edges: EdgeEntity.AllAttributes[],
  ) {
    if (NodeEntity.isGenerationData(node.attrs.data)) {
      const { totalTokens, model, ...genNodeData } = node.attrs.data;

      const inputNodeIds = edges
        .filter((e) => e.targetNodeId === node.attrs.id)
        .map((e) => e.sourceNodeId);

      const inputNodes = allNodes.filter((n) => inputNodeIds.includes(n.attrs.id));

      const { creditsRequired } = await this.creditCalculationService.calculateForGenerationNode({
        generatorNodeData: node.attrs.data,
        inputNodes,
      });

      return {
        ...node.attrs,
        data: {
          ...genNodeData,
          creditsRequired,
        },
      };
    }

    const { totalTokens, ...nodeData } = node.attrs.data;

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
