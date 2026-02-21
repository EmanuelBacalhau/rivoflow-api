import { ExternalServiceError } from '@application/errors/application/external-service.error';
import { GetTokensFromRefreshTokenCommand } from '@aws-sdk/client-cognito-identity-provider';
import { cognitoClient } from '@infra/clients/cognitoClient';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';

@Injectable()
export class AuthGateway {
  constructor(private readonly appConfig: AppConfig) {}

  async signWIthGoogle(params: AuthGateway.SignWithGoogleParams): Promise<AuthGateway.Tokens> {
    const { code, redirectUri } = params;

    const authorizationToken = Buffer.from(
      `${this.appConfig.aws.cognito.clientId}:${this.appConfig.aws.cognito.clientSecret}`,
    ).toString('base64');

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    const response = await fetch(`${this.appConfig.aws.cognito.poolDomain}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authorizationToken}`,
      },
      body,
    });

    if (!response.ok) {
      throw new ExternalServiceError(
        `Failed to sign in with Google: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as AuthGateway.FetchCognitoResponse;

    if (!data.access_token || !data.refresh_token) {
      throw new ExternalServiceError('Invalid response from Cognito');
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthGateway.Tokens> {
    const command = new GetTokensFromRefreshTokenCommand({
      ClientId: this.appConfig.aws.cognito.clientId,
      RefreshToken: refreshToken,
      ClientSecret: this.appConfig.aws.cognito.clientSecret,
    });

    const { AuthenticationResult } = await cognitoClient.send(command);

    if (!AuthenticationResult?.AccessToken || !AuthenticationResult?.RefreshToken) {
      throw new ExternalServiceError('Failed to refresh token');
    }

    return {
      accessToken: AuthenticationResult.AccessToken,
      refreshToken: AuthenticationResult.RefreshToken,
    };
  }
}

export namespace AuthGateway {
  export type SignWithGoogleParams = {
    code: string;
    redirectUri: string;
  };

  export type FetchCognitoResponse = {
    access_token: string;
    refresh_token: string;
  };

  export type Tokens = {
    accessToken: string;
    refreshToken: string;
  };
}
