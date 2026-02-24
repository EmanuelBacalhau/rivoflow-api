import { BaseController } from '@application/contracts/abstracts/base-controller';
import { SimulateCreditsUseCase } from '@application/use-cases/payments/simulate-credits.use-case';
import { Injectable } from '@kernel/decorators/injectable';
import { Schema } from '@kernel/decorators/schema';
import {
  SimulateCreditsSchemaQuery,
  simulateCreditsQuerySchema,
} from './schemas/simulate-credits.schema';

interface SimulateCreditsControllerResponse {
  credits: number;
  resultAmountInUsd: number;
}

@Injectable()
@Schema({
  type: 'QUERY',
  schema: simulateCreditsQuerySchema,
})
export class SimulateCreditsController extends BaseController<
  'private',
  SimulateCreditsControllerResponse
> {
  constructor(private readonly simulateCreditsUseCase: SimulateCreditsUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'private', Record<string, unknown>, SimulateCreditsSchemaQuery>,
  ): Promise<BaseController.Response<SimulateCreditsControllerResponse>> {
    const result = await this.simulateCreditsUseCase.execute({
      amountInBrl: request.query.amount,
    });

    return {
      statusCode: 200,
      body: {
        credits: result.credits,
        resultAmountInUsd: result.resultAmountInUsd,
      },
    };
  }
}
