import { BaseController } from '@application/contracts/abstracts/base-controller';
import { NodeEntity } from '@application/entities/node.entity';
import { CreateMotionControlNodeUseCase } from '@application/use-cases/nodes/create-motion-control-node.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  CreateMotionControlNodeSchemaBody,
  CreateMotionControlNodeSchemaParams,
  createMotionControlNodeParamsSchema,
  createMotionControlNodeSchema,
} from './schemas/create-motion-control-node.schema';

@Injectable()
@Schema({ type: 'BODY', schema: createMotionControlNodeSchema })
@Schema({ type: 'PARAMS', schema: createMotionControlNodeParamsSchema })
export class CreateMotionControlNodeController extends BaseController<'private', { node: NodeEntity.AllAttributes }> {
  constructor(private readonly useCase: CreateMotionControlNodeUseCase) { super(); }

  protected override async handle(
    request: BaseController.Request<'private', CreateMotionControlNodeSchemaBody, {}, CreateMotionControlNodeSchemaParams>,
  ): Promise<BaseController.Response<{ node: NodeEntity.AllAttributes }>> {
    const result = await this.useCase.execute({
      flowId: request.params.flowId,
      position: request.body.position,
    });
    return { statusCode: 201, body: result };
  }
}
