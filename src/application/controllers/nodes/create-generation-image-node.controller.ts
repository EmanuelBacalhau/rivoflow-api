import { BaseController } from '@application/contracts/abstracts/base-controller';
import { NodeEntity } from '@application/entities/node.entity';
import { CreateGenerationImageNodeUseCase } from '@application/use-cases/nodes/create-generation-image-node.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  CreateGenerationImageNodeSchemaBody,
  CreateGenerationImageNodeSchemaParams,
  createGenerationImageNodeParamsSchema,
  createGenerationImageNodeSchema,
} from './schemas/create-generation-image-node.schema';

@Injectable()
@Schema({
  type: 'BODY',
  schema: createGenerationImageNodeSchema,
})
@Schema({
  type: 'PARAMS',
  schema: createGenerationImageNodeParamsSchema,
})
export class CreateGenerationImageNodeController extends BaseController<
  'private',
  {
    node: NodeEntity.AllAttributes;
  }
> {
  constructor(private readonly createGenerationImageNodeUseCase: CreateGenerationImageNodeUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<
      'private',
      CreateGenerationImageNodeSchemaBody,
      {},
      CreateGenerationImageNodeSchemaParams
    >,
  ): Promise<
    BaseController.Response<{
      node: NodeEntity.AllAttributes;
    }>
  > {
    const result = await this.createGenerationImageNodeUseCase.execute({
      flowId: request.params.flowId,
      position: request.body.position,
    });

    return {
      statusCode: 201,
      body: result,
    };
  }
}
