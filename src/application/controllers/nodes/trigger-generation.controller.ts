import { BaseController } from '@application/contracts/abstracts/base-controller';
import { TriggerGenerationUseCase } from '@application/use-cases/nodes/trigger-generation.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  TriggerGenerationSchemaParams,
  triggerGenerationParamsSchema,
} from './schemas/trigger-generation.schema';

@Injectable()
@Schema({
  type: 'PARAMS',
  schema: triggerGenerationParamsSchema,
})
export class TriggerGenerationController extends BaseController<'private'> {
  constructor(private readonly triggerGenerationUseCase: TriggerGenerationUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'private', {}, {}, TriggerGenerationSchemaParams>,
  ): Promise<BaseController.Response> {
    await this.triggerGenerationUseCase.execute({
      flowId: request.params.flowId,
      nodeGeneratorId: request.params.nodeId,
      accountId: request.accountId,
    });

    return {
      statusCode: 201,
    };
  }
}
