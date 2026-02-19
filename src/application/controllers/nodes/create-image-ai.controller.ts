import { BaseController } from '@application/contracts/abstracts/base-controller';
import { CreateImageAIUseCase } from '@application/use-cases/nodes/create-image-ai.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  CreateImageAiSchemaParams,
  createImageAIParamsSchema,
} from './schemas/craete-image-ai.schema';

@Injectable()
@Schema({
  type: 'PARAMS',
  schema: createImageAIParamsSchema,
})
export class CreateImageAIController extends BaseController<'private'> {
  constructor(private readonly createImageAIUseCase: CreateImageAIUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'private', {}, {}, CreateImageAiSchemaParams>,
  ): Promise<BaseController.Response> {
    await this.createImageAIUseCase.execute({
      flowId: request.params.flowId,
      nodeGeneratorId: request.params.nodeId,
    });

    return {
      statusCode: 201,
    };
  }
}
