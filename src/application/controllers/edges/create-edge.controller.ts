import { BaseController } from '@application/contracts/abstracts/base-controller';
import { EdgeEntity } from '@application/entities/edge.entity';
import { CreateEdgeUseCase } from '@application/use-cases/edges/create-edge.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import { CreateEdgeSchemaBody, createEdgeSchema } from './schemas/create-edge.schema';

interface CreateEdgeResponse {
  edge: EdgeEntity.AllAttributes;
}

@Injectable()
@Schema({
  type: 'BODY',
  schema: createEdgeSchema,
})
export class CreateEdgeController extends BaseController<'public', CreateEdgeResponse> {
  constructor(private readonly createEdgeUseCase: CreateEdgeUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'public', CreateEdgeSchemaBody>,
  ): Promise<BaseController.Response<CreateEdgeResponse>> {
    const result = await this.createEdgeUseCase.execute({
      flowId: request.body.flowId,
      sourceNodeId: request.body.sourceNodeId,
      targetNodeId: request.body.targetNodeId,
    });

    return {
      statusCode: 201,
      body: result,
    };
  }
}
