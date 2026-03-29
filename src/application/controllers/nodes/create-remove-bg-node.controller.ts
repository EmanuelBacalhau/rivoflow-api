import { BaseController } from '@application/contracts/abstracts/base-controller';
import { NodeEntity } from '@application/entities/node.entity';
import { CreateRemoveBgNodeUseCase } from '@application/use-cases/nodes/create-remove-bg-node.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  CreateRemoveBgNodeSchemaBody,
  CreateRemoveBgNodeSchemaParams,
  createRemoveBgNodeParamsSchema,
  createRemoveBgNodeSchema,
} from './schemas/create-remove-bg-node.schema';

@Injectable()
@Schema({
  type: 'BODY',
  schema: createRemoveBgNodeSchema,
})
@Schema({
  type: 'PARAMS',
  schema: createRemoveBgNodeParamsSchema,
})
export class CreateRemoveBgNodeController extends BaseController<
  'private',
  {
    node: NodeEntity.AllAttributes;
  }
> {
  constructor(private readonly useCase: CreateRemoveBgNodeUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<
      'private',
      CreateRemoveBgNodeSchemaBody,
      {},
      CreateRemoveBgNodeSchemaParams
    >,
  ): Promise<
    BaseController.Response<{
      node: NodeEntity.AllAttributes;
    }>
  > {
    const result = await this.useCase.execute({
      flowId: request.params.flowId,
      position: request.body.position,
    });
    return {
      statusCode: 201,
      body: result,
    };
  }
}
