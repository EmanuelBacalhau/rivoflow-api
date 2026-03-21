import { BaseController } from '@application/contracts/abstracts/base-controller';
import { ExchangeCodeUseCase } from '@application/use-cases/auth/exchange-code.use-case';
import { buildAuthCookies } from '@application/utils/cookie-builder';
import { AppConfig } from '@shared/config/app.config';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import { ExchangeCodeSchemaQuery, exchangeCodeQuerySchema } from './schemas/exchange-code.schema';

@Injectable()
@Schema({
  type: 'QUERY',
  schema: exchangeCodeQuerySchema,
})
export class ExchangeCodeController extends BaseController<'public'> {
  constructor(
    private readonly exchangeCodeUseCase: ExchangeCodeUseCase,
    private readonly appConfig: AppConfig,
  ) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'public', {}, ExchangeCodeSchemaQuery>,
  ): Promise<BaseController.Response> {
    const tokens = await this.exchangeCodeUseCase.execute(request.query);

    return {
      statusCode: 200,
      cookies: buildAuthCookies(tokens, this.appConfig.app.isProduction),
    };
  }
}
