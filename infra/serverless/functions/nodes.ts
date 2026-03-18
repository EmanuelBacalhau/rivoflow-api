import type { Functions } from '../types';

export const nodeFunctions: Functions = {
  createPromptNode: {
    handler: 'src/main/functions/nodes/create-prompt-node.handler',
    events: [
      {
        httpApi: {
          method: 'POST',
          path: '/flows/{flowId}/nodes/prompt',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  createFileNode: {
    handler: 'src/main/functions/nodes/create-file-node.handler',
    events: [
      {
        httpApi: {
          method: 'POST',
          path: '/flows/{flowId}/nodes/file',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  createGenerationImageNode: {
    handler: 'src/main/functions/nodes/create-generation-image-node.handler',
    events: [
      {
        httpApi: {
          method: 'POST',
          path: '/flows/{flowId}/nodes/generation-image',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  updateNode: {
    handler: 'src/main/functions/nodes/update-node.handler',
    events: [
      {
        httpApi: {
          method: 'PUT',
          path: '/flows/{flowId}/nodes/{nodeId}',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  uploadFile: {
    handler: 'src/main/functions/nodes/upload-file.handler',
    events: [
      {
        httpApi: {
          method: 'POST',
          path: '/flows/{flowId}/nodes/{nodeId}/upload',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  deleteNode: {
    handler: 'src/main/functions/nodes/delete-node.handler',
    events: [
      {
        httpApi: {
          method: 'DELETE',
          path: '/flows/{flowId}/nodes/{nodeId}',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  createImageAI: {
    handler: 'src/main/functions/nodes/create-image-ai.handler',
    events: [
      {
        httpApi: {
          method: 'POST',
          path: '/flows/{flowId}/nodes/{nodeId}/generate-image',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  processImageAI: {
    handler: 'src/main/functions/nodes/process-image-ai.handler',
    memorySize: 1024,
    timeout: 300,
    events: [
      {
        sqs: {
          arn: {
            'Fn::GetAtt': [
              'ImageQueue',
              'Arn',
            ],
          },
          batchSize: 2,
        },
      },
    ],
  },
  calculateCreditsNodeGenerator: {
    handler: 'src/main/functions/nodes/calculate-credits-node-generator.handler',
    events: [
      {
        httpApi: {
          method: 'GET',
          path: '/flows/{flowId}/nodes/{nodeId}/calculate-credits',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
};
