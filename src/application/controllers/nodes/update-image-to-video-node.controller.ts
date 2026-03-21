import { BaseController } from '@application/contracts/abstracts/base-controller';
import { UpdateImageToVideoNodeUseCase } from '@application/use-cases/nodes/update-image-to-video-node.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  UpdateImageToVideoNodeSchemaBody,
  UpdateImageToVideoNodeSchemaParams,
  updateImageToVideoNodeParamsSchema,
  updateImageToVideoNodeSchema,
} from './schemas/update-image-to-video-node.schema';

@Injectable()
@Schema({ type: 'BODY', schema: updateImageToVideoNodeSchema })
@Schema({ type: 'PARAMS', schema: updateImageToVideoNodeParamsSchema })
export class UpdateImageToVideoNodeController extends BaseController<'private'> {
  constructor(private readonly useCase: UpdateImageToVideoNodeUseCase) { super(); }

  protected override async handle(
    request: BaseController.Request<'private', UpdateImageToVideoNodeSchemaBody, {}, UpdateImageToVideoNodeSchemaParams>,
  ): Promise<BaseController.Response> {
    await this.useCase.execute({
      nodeId: request.params.nodeId,
      flowId: request.params.flowId,
      tier: request.body.tier,
      duration: request.body.duration,
      resolution: request.body.resolution,
      aspectRatio: request.body.aspectRatio,
      generateAudio: request.body.generateAudio,
    });
    return { statusCode: 204 };
  }
}
