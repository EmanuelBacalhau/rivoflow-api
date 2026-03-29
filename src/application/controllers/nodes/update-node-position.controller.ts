import { BaseController } from '@application/contracts/abstracts/base-controller';
import { UpdateNodePositionUseCase } from '@application/use-cases/nodes/update-node-position.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  UpdateNodePositionSchemaBody,
  UpdateNodePositionSchemaParams,
  updateNodePositionParamsSchema,
  updateNodePositionSchema,
} from './schemas/update-node-position.schema';

@Injectable()
@Schema({
  type: 'BODY',
  schema: updateNodePositionSchema,
})
@Schema({
  type: 'PARAMS',
  schema: updateNodePositionParamsSchema,
})
export class UpdateNodePositionController extends BaseController<'private'> {
  constructor(private readonly updateNodePositionUseCase: UpdateNodePositionUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<
      'private',
      UpdateNodePositionSchemaBody,
      {},
      UpdateNodePositionSchemaParams
    >,
  ): Promise<BaseController.Response> {
    const { body, params } = request;

    await this.updateNodePositionUseCase.execute({
      nodeId: params.nodeId,
      flowId: params.flowId,
      position: body.position,
    });

    return {
      statusCode: 204,
    };
  }
}
