import { BaseController } from '@application/contracts/abstracts/base-controller';
import { ConfirmUploadUseCase } from '@application/use-cases/nodes/confirm-upload.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  ConfirmUploadSchemaBody,
  ConfirmUploadSchemaParams,
  confirmUploadBodySchema,
  confirmUploadParamsSchema,
} from './schemas/confirm-upload.schema';

@Injectable()
@Schema({
  type: 'BODY',
  schema: confirmUploadBodySchema,
})
@Schema({
  type: 'PARAMS',
  schema: confirmUploadParamsSchema,
})
export class ConfirmUploadController extends BaseController<'public'> {
  constructor(private readonly confirmUploadUseCase: ConfirmUploadUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<
      'public',
      ConfirmUploadSchemaBody,
      {},
      ConfirmUploadSchemaParams
    >,
  ): Promise<BaseController.Response> {
    const { body, params } = request;

    await this.confirmUploadUseCase.execute({
      nodeId: params.nodeId,
      flowId: body.flowId,
    });

    return {
      statusCode: 204,
    };
  }
}
