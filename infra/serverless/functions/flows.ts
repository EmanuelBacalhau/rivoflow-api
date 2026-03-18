import type { Functions } from '../types';

export const flowFunctions: Functions = {
  listFlowsByAccount: {
    handler: 'src/main/functions/flows/list-flows-by-account.handler',
    events: [
      {
        httpApi: {
          method: 'GET',
          path: '/flows',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  createFlow: {
    handler: 'src/main/functions/flows/create-flow.handler',
    events: [
      {
        httpApi: {
          method: 'POST',
          path: '/flows',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  getFlowById: {
    handler: 'src/main/functions/flows/get-flow-by-id.handler',
    events: [
      {
        httpApi: {
          method: 'GET',
          path: '/flows/{flowId}',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  deleteFlow: {
    handler: 'src/main/functions/flows/delete-flow.handler',
    events: [
      {
        httpApi: {
          method: 'DELETE',
          path: '/flows/{flowId}',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  updateFlow: {
    handler: 'src/main/functions/flows/update-flow.handler',
    events: [
      {
        httpApi: {
          method: 'PATCH',
          authorizer: 'MyAuthorizer',
          path: '/flows/{flowId}',
        },
      },
    ],
  },
};
