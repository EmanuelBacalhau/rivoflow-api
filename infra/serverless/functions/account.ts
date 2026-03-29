import type { Functions } from '../types';
import { warmingEvent } from '../warming';

export const accountFunctions: Functions = {
  getMe: {
    handler: 'src/main/functions/account/get-me.handler',
    events: [
      {
        httpApi: {
          method: 'GET',
          path: '/account/me',
          authorizer: 'MyAuthorizer',
        },
      },
      warmingEvent,
    ],
  },
};
