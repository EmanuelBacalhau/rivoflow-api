import type { Functions } from '../types';

export const authFunctions: Functions = {
  exchangeCode: {
    handler: 'src/main/functions/auth/exchange-code.handler',
    events: [
      {
        httpApi: {
          method: 'POST',
          path: '/auth/exchange-code',
        },
      },
    ],
  },
  preTokenGenerationTrigger: {
    handler: 'src/main/functions/auth/pre-token-generation-trigger.handler',
  },
  postConfirmationTrigger: {
    handler: 'src/main/functions/auth/post-confirmation-trigger.handler',
    dependsOn: [
      'UserPool',
    ],
    events: [
      {
        cognitoUserPool: {
          pool: '${self:service}-${self:provider.stage}-userpool',
          trigger: 'PostConfirmation',
          existing: true,
          forceDeploy: true,
        },
      },
    ],
  },
  refreshToken: {
    handler: 'src/main/functions/auth/refresh-token.handler',
    events: [
      {
        httpApi: {
          method: 'POST',
          path: '/auth/refresh-token',
        },
      },
    ],
  },
  authorizer: {
    handler: 'src/main/functions/auth/authorizer.handler',
  },
  signOut: {
    handler: 'src/main/functions/auth/sign-out.handler',
    events: [
      {
        httpApi: {
          method: 'POST',
          path: '/auth/sign-out',
        },
      },
    ],
  },
};
