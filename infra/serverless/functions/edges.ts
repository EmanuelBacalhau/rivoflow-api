import type { Functions } from '../types';

export const edgeFunctions: Functions = {
  createEdge: {
    handler: 'src/main/functions/edges/create-edge.handler',
    events: [
      {
        httpApi: {
          method: 'POST',
          path: '/flows/{flowId}/edges',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  deleteEdge: {
    handler: 'src/main/functions/edges/delete-edge.handler',
    events: [
      {
        httpApi: {
          method: 'DELETE',
          path: '/flows/{flowId}/edges/{edgeId}',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
};
