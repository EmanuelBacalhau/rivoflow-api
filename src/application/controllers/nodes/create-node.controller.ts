import { BaseController } from '@application/contracts/abstracts/base-controller';
import { NodeEntity } from '@application/entities/node.entity';
import { CreateNodeUseCase } from '@application/use-cases/nodes/create-node.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  CreateNodeSchemaBody,
  CreateNodeSchemaParams,
  createNodeParamsSchema,
  createNodeSchema,
} from './schemas/create-node.schema';

interface CreateNodeResponse {
  node: Omit<NodeEntity.AllAttributes, 'data'> & {
    data: Omit<NodeEntity.NodeData, 'totalTokens'>;
  };
  uploadSignature?: string;
}

@Injectable()
@Schema({
  type: 'BODY',
  schema: createNodeSchema,
})
@Schema({
  type: 'PARAMS',
  schema: createNodeParamsSchema,
})
export class CreateNodeController extends BaseController<'public', CreateNodeResponse> {
  constructor(private readonly createNodeUseCase: CreateNodeUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'public', CreateNodeSchemaBody, {}, CreateNodeSchemaParams>,
  ): Promise<BaseController.Response<CreateNodeResponse>> {
    const result = await this.createNodeUseCase.execute({
      type: request.body.nodeType,
      flowId: request.params.flowId,
      position: request.body.position,
    });

    return {
      statusCode: 201,
      body: result,
    };
  }
}
