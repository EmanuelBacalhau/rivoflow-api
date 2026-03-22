import { BaseController } from '@application/contracts/abstracts/base-controller';
import { RefreshTokenUseCase } from '@application/use-cases/auth/refresh-token.use-case';
import { AppConfig } from '@shared/config/app.config';
import { Injectable } from 'src/kernel/decorators/injectable';

@Injectable()
export class RefreshTokenController extends BaseController<'public'> {
  constructor(
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly appConfig: AppConfig,
  ) {
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

    const { accessToken, refreshToken } = await this.refreshTokenUseCase.execute({
      refreshToken: refreshTokenCookie.split('=')[1],
    });
    const isProduction = this.appConfig.app.isProduction;

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
