import { BaseController } from '@application/contracts/abstracts/base-controller';
import { buildSignOutCookies } from '@application/utils/cookie-builder';
import { Injectable } from 'src/kernel/decorators/injectable';

@Injectable()
export class SignOutController extends BaseController<'public'> {
  protected override async handle(): Promise<BaseController.Response> {
    return {
      statusCode: 200,
      cookies: buildSignOutCookies(),
    };
  }
}
