import { BaseController } from '@application/contracts/abstracts/base-controller';
import { UpdateTextToImageNodeUseCase } from '@application/use-cases/nodes/update-text-to-image-node.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  UpdateTextToImageNodeSchemaBody,
  UpdateTextToImageNodeSchemaParams,
  updateTextToImageNodeParamsSchema,
  updateTextToImageNodeSchema,
} from './schemas/update-text-to-image-node.schema';

@Injectable()
@Schema({ type: 'BODY', schema: updateTextToImageNodeSchema })
@Schema({ type: 'PARAMS', schema: updateTextToImageNodeParamsSchema })
export class UpdateTextToImageNodeController extends BaseController<'private'> {
  constructor(private readonly useCase: UpdateTextToImageNodeUseCase) { super(); }

  protected override async handle(
    request: BaseController.Request<'private', UpdateTextToImageNodeSchemaBody, {}, UpdateTextToImageNodeSchemaParams>,
  ): Promise<BaseController.Response> {
    await this.useCase.execute({
      nodeId: request.params.nodeId,
      flowId: request.params.flowId,
      imageSize: request.body.imageSize,
      guidanceScale: request.body.guidanceScale,
      seed: request.body.seed,
    });
    return { statusCode: 204 };
  }
}
