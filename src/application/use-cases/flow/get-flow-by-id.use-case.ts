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

interface GetFlowByIdUseCaseOutput {
  flow: Omit<FlowEntity.AllAttributes, 'nodes' | 'edges'>;
  nodes: Array<
    NodeEntity.AllAttributes & {
      data: NodeEntity.AllAttributes['data'] & {
        imageUrl?: string;
      };
    }
  >;
  edges: Array<EdgeEntity.AllAttributes>;
}
@Injectable()
export class GetFlowByIdUseCaseUseCase
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

    const nodesWithImageUrl = await Promise.all(
      flow.attrs.nodes.map(async (node) => {
        if (
          node.attrs.data.type === NodeEntity.NodeType.IMAGE &&
          node.attrs.data &&
          'key' in node.attrs.data &&
          node.attrs.data.key
        ) {
          const imageUrl = await this.fileStorageGateway.generateGetPresignedUrl(
            node.attrs.data.key,
          );

          return {
            ...node.attrs,
            data: {
              ...(node.attrs.data as NodeEntity.NodeDataFile),
              imageUrl,
            },
          };
        }

        return node.attrs;
      }),
    );

    const edges = flow.attrs.edges.map((edge) => edge.attrs);

    return {
      flow: flow.attrs,
      nodes: nodesWithImageUrl,
      edges,
    };
  }
}
