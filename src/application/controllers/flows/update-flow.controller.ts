import { BaseController } from '@application/contracts/abstracts/base-controller';
import { UpdateFlowUseCase } from '@application/use-cases/flows/update-flow.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import { createFlowSchema } from './schemas/create-flow.schema';
import {
  UpdateFlowSchemaBody,
  UpdateFlowSchemaParams,
  updateFlowSchemaParams,
} from './schemas/update-flow.schema';

@Injectable()
@Schema({
  type: 'BODY',
  schema: createFlowSchema,
})
@Schema({
  type: 'PARAMS',
  schema: updateFlowSchemaParams,
})
export class UpdateFlowController extends BaseController<'private'> {
  constructor(private readonly updateFlowUseCase: UpdateFlowUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'private', UpdateFlowSchemaBody, {}, UpdateFlowSchemaParams>,
  ): Promise<BaseController.Response> {
    await this.updateFlowUseCase.execute({
      title: request.body.title,
      accountId: request.accountId,
      flowId: request.params.flowId,
    });

    return {
      statusCode: 204,
    };
  }
}
