import { BaseController } from '@application/contracts/abstracts/base-controller';
import { RefreshTokenUseCase } from '@application/use-cases/auth/refresh-token.use-case';
import { buildAuthCookies } from '@application/utils/cookie-builder';
import { Injectable } from 'src/kernel/decorators/injectable';

@Injectable()
export class RefreshTokenController extends BaseController<'public'> {
  constructor(private readonly refreshTokenUseCase: RefreshTokenUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'public'>,
  ): Promise<BaseController.Response> {
    const cookies = request.cookies || [];

    const refreshTokenCookie = cookies.find((cookie) => cookie.startsWith('refreshToken='));

    if (!refreshTokenCookie) {
      return {
        statusCode: 401,
      };
    }

    const tokens = await this.refreshTokenUseCase.execute({
      refreshToken: refreshTokenCookie.substring('refreshToken='.length),
    });

    return {
      statusCode: 200,
      cookies: buildAuthCookies(tokens),
    };
  }
}
