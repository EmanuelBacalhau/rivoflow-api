import { BaseController } from '@application/contracts/abstracts/base-controller';
import { NodeEntity } from '@application/entities/node.entity';
import { CreateTextToImageNodeUseCase } from '@application/use-cases/nodes/create-text-to-image-node.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  CreateTextToImageNodeSchemaBody,
  CreateTextToImageNodeSchemaParams,
  createTextToImageNodeParamsSchema,
  createTextToImageNodeSchema,
} from './schemas/create-text-to-image-node.schema';

@Injectable()
@Schema({ type: 'BODY', schema: createTextToImageNodeSchema })
@Schema({ type: 'PARAMS', schema: createTextToImageNodeParamsSchema })
export class CreateTextToImageNodeController extends BaseController<'private', { node: NodeEntity.AllAttributes }> {
  constructor(private readonly useCase: CreateTextToImageNodeUseCase) { super(); }

  protected override async handle(
    request: BaseController.Request<'private', CreateTextToImageNodeSchemaBody, {}, CreateTextToImageNodeSchemaParams>,
  ): Promise<BaseController.Response<{ node: NodeEntity.AllAttributes }>> {
    const result = await this.useCase.execute({
      flowId: request.params.flowId,
      position: request.body.position,
    });
    return { statusCode: 201, body: result };
  }
}
