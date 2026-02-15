import { BaseController } from '@application/contracts/abstracts/base-controller';
import { NodeEntity } from '@application/entities/node.entity';
import { CreateNodeUseCase } from '@application/use-cases/node/create-node.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import { CreateNodeSchemaBody, createNodeSchema } from './schemas/create-node.schema';

interface CreateNodeResponse {
  node: NodeEntity.AllAttributes;
  uploadSignature?: string;
}

@Injectable()
@Schema({
  type: 'BODY',
  schema: createNodeSchema,
})
export class CreateNodeController extends BaseController<'public', CreateNodeResponse> {
  constructor(private readonly createNodeUseCase: CreateNodeUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'public', CreateNodeSchemaBody>,
  ): Promise<BaseController.Response<CreateNodeResponse>> {
    const result = await this.createNodeUseCase.execute({
      type: request.body.nodeType,
      flowId: request.body.flowId,
      position: request.body.position,
    });

    return {
      statusCode: 201,
      body: result,
    };
  }
}
