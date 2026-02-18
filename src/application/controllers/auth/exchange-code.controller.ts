import { BaseController } from '@application/contracts/abstracts/base-controller';
import { ExchangeCodeUseCase } from '@application/use-cases/auth/exchange-code.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import { ExchangeCodeSchemaQuery, exchangeCodeQuerySchema } from './schemas/exchange-code.schema';

@Injectable()
@Schema({
  type: 'QUERY',
  schema: exchangeCodeQuerySchema,
})
export class ExchangeCodeController extends BaseController<'public'> {
  constructor(private readonly exchangeCodeUseCase: ExchangeCodeUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'public', {}, ExchangeCodeSchemaQuery>,
  ): Promise<BaseController.Response> {
    const { query } = request;

    const { accessToken, refreshToken } = await this.exchangeCodeUseCase.execute(query);

    return {
      statusCode: 200,
      cookies: [
        `access_token=${accessToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=900; Path=/`,
        `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=604800; Path=/auth/refresh`,
      ],
    };
  }
}
