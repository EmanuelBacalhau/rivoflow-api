import { BaseController } from '@application/contracts/abstracts/base-controller';
import { UpdateNodeUseCase } from '@application/use-cases/nodes/update-node.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  UpdateNodeSchemaBody,
  UpdateNodeSchemaParams,
  updateNodeParamsSchema,
  updateNodeSchema,
} from './schemas/update-node.schema';

@Injectable()
@Schema({
  type: 'BODY',
  schema: updateNodeSchema,
})
@Schema({
  type: 'PARAMS',
  schema: updateNodeParamsSchema,
})
export class UpdateNodeController extends BaseController<'public'> {
  constructor(private readonly updateNodeUseCase: UpdateNodeUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'public', UpdateNodeSchemaBody, {}, UpdateNodeSchemaParams>,
  ): Promise<BaseController.Response> {
    const { body, params } = request;

    await this.updateNodeUseCase.execute({
      nodeId: params.nodeId,
      flowId: body.flowId,
      position: body.position,
      data: body.data,
    });

    return {
      statusCode: 204,
    };
  }
}
