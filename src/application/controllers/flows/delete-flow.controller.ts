import { BaseController } from '@application/contracts/abstracts/base-controller';
import { DeleteFlowUseCase } from '@application/use-cases/flows/delete-flow.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import { DeleteFlowSchemaParams, deleteFlowSchema } from './schemas/delete-flow.schema';

@Injectable()
@Schema({
  type: 'PARAMS',
  schema: deleteFlowSchema,
})
export class DeleteFlowController extends BaseController<'private'> {
  constructor(private readonly deleteFlowUseCase: DeleteFlowUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'private', {}, {}, DeleteFlowSchemaParams>,
  ): Promise<BaseController.Response> {
    await this.deleteFlowUseCase.execute({
      flowId: request.params.flowId,
      accountId: request.accountId,
    });

    return {
      statusCode: 200,
    };
  }
}
