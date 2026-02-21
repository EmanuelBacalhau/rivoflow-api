import { APIGatewayRequestAuthorizerEventV2 } from 'aws-lambda';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS_URL = `https://cognito-idp.${process.env.REGION}.amazonaws.com/${process.env.USER_POOL_ID}/.well-known/jwks.json`;
const ISSUER = `https://cognito-idp.${process.env.REGION}.amazonaws.com/${process.env.USER_POOL_ID}`;
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

export const handler = async (event: APIGatewayRequestAuthorizerEventV2) => {
  const accessToken = event.cookies?.find((c) => c.startsWith('accessToken='));
  if (!accessToken) {
    throw new Error('Unauthorized');
  }
  const token = accessToken.split('=')[1];
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
    });
    return {
      isAuthorized: true,
      context: {
        internalAccountId: payload.internalAccountId,
      },
    };
  } catch {
    throw new Error('Unauthorized');
  }
};
