import { BaseController } from '@application/contracts/abstracts/base-controller';
import { FlowEntity } from '@application/entities/flow.entity';
import { ListFlowsByAccountUseCase } from '@application/use-cases/flows/list-flows-by-account.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';

interface ListFlowsByAccountControllerOutput {
  flows: Omit<FlowEntity.AllAttributes, 'nodes' | 'edges'>[];
}

@Injectable()
export class ListFlowsByAccountController extends BaseController<
  'private',
  ListFlowsByAccountControllerOutput
> {
  constructor(private readonly listFlowsByAccountUseCase: ListFlowsByAccountUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'private'>,
  ): Promise<BaseController.Response<ListFlowsByAccountControllerOutput>> {
    const result = await this.listFlowsByAccountUseCase.execute({
      accountId: request.accountId,
    });

    return {
      statusCode: 200,
      body: result,
    };
  }
}
