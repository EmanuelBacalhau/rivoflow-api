import { BaseController } from '@application/contracts/abstracts/base-controller';
import { ConfirmUploadUseCase } from '@application/use-cases/nodes/confirm-upload.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  ConfirmUploadSchemaParams,
  confirmUploadParamsSchema,
} from './schemas/confirm-upload.schema';

@Injectable()
@Schema({
  type: 'PARAMS',
  schema: confirmUploadParamsSchema,
})
export class ConfirmUploadController extends BaseController<'public'> {
  constructor(private readonly confirmUploadUseCase: ConfirmUploadUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'public', {}, {}, ConfirmUploadSchemaParams>,
  ): Promise<BaseController.Response> {
    await this.confirmUploadUseCase.execute({
      nodeId: request.params.nodeId,
      flowId: request.params.flowId,
    });

    return {
      statusCode: 204,
    };
  }
}
