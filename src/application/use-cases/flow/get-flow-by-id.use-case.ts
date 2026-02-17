import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { EdgeEntity } from '@application/entities/edge.entity';
import { FlowEntity } from '@application/entities/flow.entity';
import { NodeEntity } from '@application/entities/node.entity';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { FlowDynamoRepository } from '@infra/database/dynamo/repositories/flow-dynamo.repository';
import { FileStorageGateway } from '@infra/gateways/aws/FileStorageGateway';
import { Injectable } from 'src/kernel/decorators/injectable';

interface GetFlowByIdUseCaseInput {
  flowId: string;
}

type NodeDataOutput = Omit<NodeEntity.AllAttributes['data'], 'totalTokens'> & {
  imageUrl?: string;
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

    const nodes = await Promise.all(flow.attrs.nodes.map((node) => this.transformNode(node)));

    const edges = flow.attrs.edges.map((edge) => edge.attrs);

    return {
      flow: {
        id: flow.attrs.id,
        title: flow.attrs.title,
        projectId: flow.attrs.projectId,
        createdAt: flow.attrs.createdAt,
        updatedAt: flow.attrs.updatedAt,
      },
      nodes,
      edges,
    };
  }

  private async transformNode(node: NodeEntity) {
    const { totalTokens, ...nodeData } = node.attrs.data;

    if ('key' in node.attrs.data && node.attrs.data.key) {
      const imageUrl = await this.fileStorageGateway.generateGetPresignedUrl(node.attrs.data.key);

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
