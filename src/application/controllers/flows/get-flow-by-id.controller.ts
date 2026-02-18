import { BaseController } from '@application/contracts/abstracts/base-controller';
import { EdgeEntity } from '@application/entities/edge.entity';
import { FlowEntity } from '@application/entities/flow.entity';
import { NodeEntity } from '@application/entities/node.entity';
import { GetFlowByIdUseCase } from '@application/use-cases/flows/get-flow-by-id.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import { GetFlowByIdSchemaBody, getFlowByIdSchema } from './schemas/get-flow-by-id.schema';

type NodeDataOutput = Omit<NodeEntity.AllAttributes['data'], 'totalTokens'> & {
  imageUrl?: string;
};

type NodeOutput = Omit<NodeEntity.AllAttributes, 'data'> & {
  data: NodeDataOutput;
};

interface GetFlowByIdControllerOutput {
  flow: Omit<FlowEntity.AllAttributes, 'nodes' | 'edges'>;
  nodes: NodeOutput[];
  edges: EdgeEntity.AllAttributes[];
}

@Injectable()
@Schema({
  type: 'PARAMS',
  schema: getFlowByIdSchema,
})
export class GetFlowByIdController extends BaseController<'public', GetFlowByIdControllerOutput> {
  constructor(private readonly getFlowByIdUseCase: GetFlowByIdUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'public', {}, {}, GetFlowByIdSchemaBody>,
  ): Promise<BaseController.Response<GetFlowByIdControllerOutput>> {
    const result = await this.getFlowByIdUseCase.execute({
      flowId: request.params.flowId,
    });

    return {
      statusCode: 201,
      body: result,
    };
  }
}
