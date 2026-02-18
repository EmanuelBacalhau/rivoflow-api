import { BaseController } from '@application/contracts/abstracts/base-controller';
import { FlowEntity } from '@application/entities/flow.entity';
import { CreateFlowUseCase } from '@application/use-cases/flows/create-flow.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import { CreateFlowSchemaBody, createFlowSchema } from './schemas/create-flow.schema';

interface CreateFlowControllerOutput {
  flow: FlowEntity.AllAttributes;
}

@Injectable()
@Schema({
  type: 'BODY',
  schema: createFlowSchema,
})
export class CreateFlowController extends BaseController<'public', CreateFlowControllerOutput> {
  constructor(private readonly createFlowUseCase: CreateFlowUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'public', CreateFlowSchemaBody>,
  ): Promise<BaseController.Response<CreateFlowControllerOutput>> {
    const result = await this.createFlowUseCase.execute({
      title: request.body.title,
      projectId: request.body.projectId,
    });

    return {
      statusCode: 201,
      body: result,
    };
  }
}
