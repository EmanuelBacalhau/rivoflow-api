import { BaseController } from '@application/contracts/abstracts/base-controller';
import { UpdatePromptNodeUseCase } from '@application/use-cases/nodes/update-prompt-node.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  UpdatePromptNodeSchemaBody,
  UpdatePromptNodeSchemaParams,
  updatePromptNodeParamsSchema,
  updatePromptNodeSchema,
} from './schemas/update-prompt-node.schema';

@Injectable()
@Schema({
  type: 'BODY',
  schema: updatePromptNodeSchema,
})
@Schema({
  type: 'PARAMS',
  schema: updatePromptNodeParamsSchema,
})
export class UpdatePromptNodeController extends BaseController<'private'> {
  constructor(private readonly updatePromptNodeUseCase: UpdatePromptNodeUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'private', UpdatePromptNodeSchemaBody, {}, UpdatePromptNodeSchemaParams>,
  ): Promise<BaseController.Response> {
    const { body, params } = request;

    await this.updatePromptNodeUseCase.execute({
      nodeId: params.nodeId,
      flowId: params.flowId,
      prompt: body.prompt,
    });

    return {
      statusCode: 204,
    };
  }
}
