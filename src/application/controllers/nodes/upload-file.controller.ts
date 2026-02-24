import { BaseController } from '@application/contracts/abstracts/base-controller';
import { UploadFileUseCase } from '@application/use-cases/nodes/upload-file.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  UploadFileSchemaBody,
  UploadFileSchemaParams,
  uploadFileBodySchema,
  uploadFileParamsSchema,
} from './schemas/upload-file.schema';

interface UploadFileControllerResponse {
  uploadSignature: string;
  key: string;
  imageUrl: string;
}

@Injectable()
@Schema({
  type: 'BODY',
  schema: uploadFileBodySchema,
})
@Schema({
  type: 'PARAMS',
  schema: uploadFileParamsSchema,
})
export class UploadFileController extends BaseController<'private', UploadFileControllerResponse> {
  constructor(private readonly uploadFileUseCase: UploadFileUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'private', UploadFileSchemaBody, {}, UploadFileSchemaParams>,
  ): Promise<BaseController.Response<UploadFileControllerResponse>> {
    const { body, params } = request;

    const result = await this.uploadFileUseCase.execute({
      flowId: params.flowId,
      nodeId: params.nodeId,
      accountId: request.accountId,
      file: body.file,
    });

    return {
      statusCode: 200,
      body: result,
    };
  }
}
