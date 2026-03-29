import { BaseController } from '@application/contracts/abstracts/base-controller';
import { NodeEntity } from '@application/entities/node.entity';
import { CreatePromptNodeUseCase } from '@application/use-cases/nodes/create-prompt-node.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  CreatePromptNodeSchemaBody,
  CreatePromptNodeSchemaParams,
  createPromptNodeParamsSchema,
  createPromptNodeSchema,
} from './schemas/create-prompt-node.schema';

@Injectable()
@Schema({
  type: 'BODY',
  schema: createPromptNodeSchema,
})
@Schema({
  type: 'PARAMS',
  schema: createPromptNodeParamsSchema,
})
export class CreatePromptNodeController extends BaseController<
  'private',
  {
    node: NodeEntity.AllAttributes;
  }
> {
  constructor(private readonly createPromptNodeUseCase: CreatePromptNodeUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<
      'private',
      CreatePromptNodeSchemaBody,
      {},
      CreatePromptNodeSchemaParams
    >,
  ): Promise<
    BaseController.Response<{
      node: NodeEntity.AllAttributes;
    }>
  > {
    const result = await this.createPromptNodeUseCase.execute({
      flowId: request.params.flowId,
      position: request.body.position,
    });

    return {
      statusCode: 201,
      body: result,
    };
  }
}
