import { BaseController } from '@application/contracts/abstracts/base-controller';
import { CalculateCreditsNodeGeneratorUseCase } from '@application/use-cases/nodes/calculate-credits-node-generator.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import {
  CalculateCreditsNodeGeneratorSchemaParams,
  calculateCreditsNodeGeneratorParamsSchema,
} from './schemas/calculate-credits-node-generator.schema';

type CalculateCreditsNodeGeneratorControllerResponse = {
  creditsRequired: number;
};

@Injectable()
@Schema({
  type: 'PARAMS',
  schema: calculateCreditsNodeGeneratorParamsSchema,
})
export class CalculateCreditsNodeGeneratorController extends BaseController<
  'public',
  CalculateCreditsNodeGeneratorControllerResponse
> {
  constructor(
    private readonly calculateCreditsNodeGeneratorUseCase: CalculateCreditsNodeGeneratorUseCase,
  ) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'public', {}, {}, CalculateCreditsNodeGeneratorSchemaParams>,
  ): Promise<BaseController.Response<CalculateCreditsNodeGeneratorControllerResponse>> {
    const { params } = request;

    const { creditsRequired } = await this.calculateCreditsNodeGeneratorUseCase.execute({
      flowId: params.flowId,
      nodeId: params.nodeId,
    });

    return {
      statusCode: 200,
      body: {
        creditsRequired,
      },
    };
  }
}
