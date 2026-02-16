import { BaseController } from '@application/contracts/abstracts/base-controller';
import { CreateImageAIUseCase } from '@application/use-cases/node/create-image-ai.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import { CreateImageAiSchemaBody, createImageAISchema } from './schemas/craete-image-ai.schema';

@Injectable()
@Schema({
  type: 'BODY',
  schema: createImageAISchema,
})
export class CreateImageAIController extends BaseController<'public'> {
  constructor(private readonly createImageAIUseCase: CreateImageAIUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'public', CreateImageAiSchemaBody>,
  ): Promise<BaseController.Response> {
    await this.createImageAIUseCase.execute(request.body);

    return {
      statusCode: 201,
    };
  }
}
