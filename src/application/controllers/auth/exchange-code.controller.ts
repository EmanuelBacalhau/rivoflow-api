import { BaseController } from '@application/contracts/abstracts/base-controller';
import { ExchangeCodeUseCase } from '@application/use-cases/auth/exchange-code.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import { ExchangeCodeSchemaQuery, exchangeCodeQuerySchema } from './schemas/exchange-code.schema';

interface ExchangeCodeControllerOutput {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
@Schema({
  type: 'QUERY',
  schema: exchangeCodeQuerySchema,
})
export class ExchangeCodeController extends BaseController<'public', ExchangeCodeControllerOutput> {
  constructor(private readonly exchangeCodeUseCase: ExchangeCodeUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'public', {}, ExchangeCodeSchemaQuery>,
  ): Promise<BaseController.Response<ExchangeCodeControllerOutput>> {
    const { query } = request;

    const { accessToken, refreshToken } = await this.exchangeCodeUseCase.execute(query);

    return {
      statusCode: 200,
      body: {
        accessToken,
        refreshToken,
      },
    };
  }
}
