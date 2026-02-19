import { BaseController } from '@application/contracts/abstracts/base-controller';
import { DeleteEdgeUseCase } from '@application/use-cases/edges/delete-edge.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import { DeleteEdgeSchemaBody, deleteEdgeSchema } from './schemas/delete-edge.schema';

@Injectable()
@Schema({
  type: 'PARAMS',
  schema: deleteEdgeSchema,
})
export class DeleteEdgeController extends BaseController<'public'> {
  constructor(private readonly deleteEdgeUseCase: DeleteEdgeUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'public', {}, {}, DeleteEdgeSchemaBody>,
  ): Promise<BaseController.Response> {
    await this.deleteEdgeUseCase.execute(request.params);

    return {
      statusCode: 204,
    };
  }
}
