import { BaseController } from '@application/contracts/abstracts/base-controller';
import { DeleteNodeUseCase } from '@application/use-cases/nodes/delete-node.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import { DeleteNodeSchemaParams, deleteNodeParamsSchema } from './schemas/delete-node.schema';

@Injectable()
@Schema({
  type: 'PARAMS',
  schema: deleteNodeParamsSchema,
})
export class DeleteNodeController extends BaseController<'public'> {
  constructor(private readonly deleteNodeUseCase: DeleteNodeUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'public', {}, {}, DeleteNodeSchemaParams>,
  ): Promise<BaseController.Response> {
    const { params } = request;

    await this.deleteNodeUseCase.execute({
      flowId: params.flowId,
      nodeId: params.nodeId,
    });

    return {
      statusCode: 204,
    };
  }
}
