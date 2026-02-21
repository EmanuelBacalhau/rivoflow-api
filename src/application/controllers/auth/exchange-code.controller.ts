import { BaseController } from '@application/contracts/abstracts/base-controller';
import { ExchangeCodeUseCase } from '@application/use-cases/auth/exchange-code.use-case';
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
    const { query } = request;

    const { accessToken, refreshToken } = await this.exchangeCodeUseCase.execute(query);
    const isProduction = this.appConfig.app.isProduction !== 'true';

    const sameSite = isProduction ? 'none' : 'lax';
    const secure = isProduction;

    return {
      statusCode: 200,
      cookies: [
        `accessToken=${accessToken}; HttpOnly; Path=/; Max-Age=3600; SameSite=${sameSite}; Secure=${secure}`,
        `refreshToken=${refreshToken}; HttpOnly; Path=/; SameSite=${sameSite}; Secure=${secure}`,
      ],
    };
  }
}
