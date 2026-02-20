import { BaseController } from '@application/contracts/abstracts/base-controller';
import { GetMeUseCase } from '@application/use-cases/account/get-me.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';

type GetMeControllerOutput = Awaited<ReturnType<GetMeUseCase['execute']>>;

@Injectable()
export class GetMeController extends BaseController<'private', GetMeControllerOutput> {
  constructor(private readonly getMeUseCase: GetMeUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'private'>,
  ): Promise<BaseController.Response<GetMeControllerOutput>> {
    const result = await this.getMeUseCase.execute({
      accountId: request.accountId,
    });

    return {
      statusCode: 200,
      body: result,
    };
  }
}
