import { BaseController } from '@application/contracts/abstracts/base-controller';
import { NodeEntity } from '@application/entities/node.entity';
import { CreateImageToVideoNodeUseCase } from '@application/use-cases/nodes/create-image-to-video-node.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  CreateImageToVideoNodeSchemaBody,
  CreateImageToVideoNodeSchemaParams,
  createImageToVideoNodeParamsSchema,
  createImageToVideoNodeSchema,
} from './schemas/create-image-to-video-node.schema';

@Injectable()
@Schema({
  type: 'BODY',
  schema: createImageToVideoNodeSchema,
})
@Schema({
  type: 'PARAMS',
  schema: createImageToVideoNodeParamsSchema,
})
export class CreateImageToVideoNodeController extends BaseController<
  'private',
  {
    node: NodeEntity.AllAttributes;
  }
> {
  constructor(private readonly useCase: CreateImageToVideoNodeUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<
      'private',
      CreateImageToVideoNodeSchemaBody,
      {},
      CreateImageToVideoNodeSchemaParams
    >,
  ): Promise<
    BaseController.Response<{
      node: NodeEntity.AllAttributes;
    }>
  > {
    const result = await this.useCase.execute({
      flowId: request.params.flowId,
      position: request.body.position,
      tier: request.body.tier,
    });
    return {
      statusCode: 201,
      body: result,
    };
  }
}
