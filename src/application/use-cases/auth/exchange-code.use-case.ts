import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { AuthGateway } from '@infra/gateways/aws/auth.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

type ExchangeCodeUseCaseInput = {
  code: string;
  redirectUri: string;
};

type ExchangeCodeUseCaseOutput = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class ExchangeCodeUseCase
  implements IUseCase<ExchangeCodeUseCaseInput, ExchangeCodeUseCaseOutput>
{
  constructor(private readonly authGateway: AuthGateway) {}

  async execute(input: ExchangeCodeUseCaseInput): Promise<ExchangeCodeUseCaseOutput> {
    const { code, redirectUri } = input;

    const tokens = await this.authGateway.signWIthGoogle({
      code,
      redirectUri,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}
