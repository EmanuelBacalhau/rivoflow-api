import { BaseController } from '@application/contracts/abstracts/base-controller';
import { NodeEntity } from '@application/entities/node.entity';
import { CreateFileNodeUseCase } from '@application/use-cases/nodes/create-file-node.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  CreateFileNodeSchemaBody,
  CreateFileNodeSchemaParams,
  createFileNodeParamsSchema,
  createFileNodeSchema,
} from './schemas/create-file-node.schema';

@Injectable()
@Schema({
  type: 'BODY',
  schema: createFileNodeSchema,
})
@Schema({
  type: 'PARAMS',
  schema: createFileNodeParamsSchema,
})
export class CreateVideoNodeController extends BaseController<
  'private',
  {
    node: NodeEntity.AllAttributes;
  }
> {
  constructor(private readonly createFileNodeUseCase: CreateFileNodeUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<
      'private',
      CreateFileNodeSchemaBody,
      {},
      CreateFileNodeSchemaParams
    >,
  ): Promise<
    BaseController.Response<{
      node: NodeEntity.AllAttributes;
    }>
  > {
    const result = await this.createFileNodeUseCase.execute({
      flowId: request.params.flowId,
      position: request.body.position,
      nodeType: NodeEntity.NodeType.VIDEO,
    });

    return {
      statusCode: 201,
      body: result,
    };
  }
}
