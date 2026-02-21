import { BaseController } from '@application/contracts/abstracts/base-controller';
import { AppConfig } from '@shared/config/app.config';
import { Injectable } from 'src/kernel/decorators/injectable';

@Injectable()
export class SignOutController extends BaseController<'public'> {
  constructor(private readonly appConfig: AppConfig) {
    super();
  }

  protected override async handle(): Promise<BaseController.Response> {
    const isProduction = this.appConfig.app.isProduction === 'true';

    const sameSite = isProduction ? 'none' : 'lax';
    const secure = isProduction;

    return {
      statusCode: 200,
      cookies: [
        `accessToken=; HttpOnly; Path=/; Max-Age=0; SameSite=${sameSite}; Secure=${secure}`,
        `refreshToken=; HttpOnly; Path=/; Max-Age=0; SameSite=${sameSite}; Secure=${secure}`,
      ],
    };
  }
}
