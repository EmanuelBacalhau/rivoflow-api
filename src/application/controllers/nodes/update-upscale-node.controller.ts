import { BaseController } from '@application/contracts/abstracts/base-controller';
import { UpdateUpscaleNodeUseCase } from '@application/use-cases/nodes/update-upscale-node.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  UpdateUpscaleNodeSchemaBody,
  UpdateUpscaleNodeSchemaParams,
  updateUpscaleNodeParamsSchema,
  updateUpscaleNodeSchema,
} from './schemas/update-upscale-node.schema';

@Injectable()
@Schema({ type: 'BODY', schema: updateUpscaleNodeSchema })
@Schema({ type: 'PARAMS', schema: updateUpscaleNodeParamsSchema })
export class UpdateUpscaleNodeController extends BaseController<'private'> {
  constructor(private readonly useCase: UpdateUpscaleNodeUseCase) { super(); }

  protected override async handle(
    request: BaseController.Request<'private', UpdateUpscaleNodeSchemaBody, {}, UpdateUpscaleNodeSchemaParams>,
  ): Promise<BaseController.Response> {
    await this.useCase.execute({
      nodeId: request.params.nodeId,
      flowId: request.params.flowId,
      scale: request.body.scale,
    });
    return { statusCode: 204 };
  }
}
