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

    const nodes = await Promise.all(
      flow.attrs.nodes.map((node) => this.transformNode(node)),
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

  private async transformNode(node: NodeEntity) {
    if (node.isGeneration()) {
      const { model, ...genNodeData } = node.attrs.data;

      const { creditsRequired } = await this.creditService.calculateForGenerationNode({
        generatorNodeData: node.attrs.data,
      });

      return {
        ...node.attrs,
        data: { ...genNodeData, creditsRequired },
      };
    }

    if (node.isImage() && node.attrs.data.key) {
      const imageUrl = this.fileStorageGateway.generateCdnUrl(node.attrs.data.key);

      return {
        ...node.attrs,
        data: { ...node.attrs.data, imageUrl },
      };
    }

    return { ...node.attrs };
  }
}
