import { BaseController } from '@application/contracts/abstracts/base-controller';
import { UpdateMotionControlNodeUseCase } from '@application/use-cases/nodes/update-motion-control-node.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  UpdateMotionControlNodeSchemaBody,
  UpdateMotionControlNodeSchemaParams,
  updateMotionControlNodeParamsSchema,
  updateMotionControlNodeSchema,
} from './schemas/update-motion-control-node.schema';

@Injectable()
@Schema({ type: 'BODY', schema: updateMotionControlNodeSchema })
@Schema({ type: 'PARAMS', schema: updateMotionControlNodeParamsSchema })
export class UpdateMotionControlNodeController extends BaseController<'private'> {
  constructor(private readonly useCase: UpdateMotionControlNodeUseCase) { super(); }

  protected override async handle(
    request: BaseController.Request<'private', UpdateMotionControlNodeSchemaBody, {}, UpdateMotionControlNodeSchemaParams>,
  ): Promise<BaseController.Response> {
    await this.useCase.execute({
      nodeId: request.params.nodeId,
      flowId: request.params.flowId,
      characterOrientation: request.body.characterOrientation,
      keepOriginalSound: request.body.keepOriginalSound,
    });
    return { statusCode: 204 };
  }
}
