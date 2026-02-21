import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { AuthGateway } from '@infra/gateways/aws/auth.gateway';
import { Injectable } from '@kernel/decorators/injectable';

type RefreshTokenUseCaseInput = {
  refreshToken: string;
};

type RefreshTokenUseCaseOutput = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class RefreshTokenUseCase
  implements IUseCase<RefreshTokenUseCaseInput, RefreshTokenUseCaseOutput>
{
  constructor(private readonly authGateway: AuthGateway) {}

  async execute(input: RefreshTokenUseCaseInput): Promise<RefreshTokenUseCaseOutput> {
    const { refreshToken } = input;

    const response = await this.authGateway.refreshToken(refreshToken);

    return response;
  }
}
