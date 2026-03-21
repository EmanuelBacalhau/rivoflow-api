import { BaseController } from '@application/contracts/abstracts/base-controller';
import { UpdateGenerationNodeUseCase } from '@application/use-cases/nodes/update-generation-node.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  UpdateGenerationNodeSchemaBody,
  UpdateGenerationNodeSchemaParams,
  updateGenerationNodeParamsSchema,
  updateGenerationNodeSchema,
} from './schemas/update-generation-node.schema';

@Injectable()
@Schema({
  type: 'BODY',
  schema: updateGenerationNodeSchema,
})
@Schema({
  type: 'PARAMS',
  schema: updateGenerationNodeParamsSchema,
})
export class UpdateGenerationNodeController extends BaseController<'private'> {
  constructor(private readonly updateGenerationNodeUseCase: UpdateGenerationNodeUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'private', UpdateGenerationNodeSchemaBody, {}, UpdateGenerationNodeSchemaParams>,
  ): Promise<BaseController.Response> {
    const { body, params } = request;

    await this.updateGenerationNodeUseCase.execute({
      nodeId: params.nodeId,
      flowId: params.flowId,
      aspectRatio: body.aspectRatio,
      quality: body.quality,
    });

    return {
      statusCode: 204,
    };
  }
}
