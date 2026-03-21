import { BaseController } from '@application/contracts/abstracts/base-controller';
import { NodeEntity } from '@application/entities/node.entity';
import { CreateUpscaleNodeUseCase } from '@application/use-cases/nodes/create-upscale-node.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  CreateUpscaleNodeSchemaBody,
  CreateUpscaleNodeSchemaParams,
  createUpscaleNodeParamsSchema,
  createUpscaleNodeSchema,
} from './schemas/create-upscale-node.schema';

@Injectable()
@Schema({ type: 'BODY', schema: createUpscaleNodeSchema })
@Schema({ type: 'PARAMS', schema: createUpscaleNodeParamsSchema })
export class CreateUpscaleNodeController extends BaseController<'private', { node: NodeEntity.AllAttributes }> {
  constructor(private readonly useCase: CreateUpscaleNodeUseCase) { super(); }

  protected override async handle(
    request: BaseController.Request<'private', CreateUpscaleNodeSchemaBody, {}, CreateUpscaleNodeSchemaParams>,
  ): Promise<BaseController.Response<{ node: NodeEntity.AllAttributes }>> {
    const result = await this.useCase.execute({
      flowId: request.params.flowId,
      position: request.body.position,
    });
    return { statusCode: 201, body: result };
  }
}
