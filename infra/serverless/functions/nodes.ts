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
  createVideoNode: {
    handler: 'src/main/functions/nodes/create-video-node.handler',
    events: [
      {
        httpApi: {
          method: 'POST',
          path: '/flows/{flowId}/nodes/video',
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
  createTextToImageNode: {
    handler: 'src/main/functions/nodes/create-text-to-image-node.handler',
    events: [
      {
        httpApi: {
          method: 'POST',
          path: '/flows/{flowId}/nodes/text-to-image',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  createUpscaleNode: {
    handler: 'src/main/functions/nodes/create-upscale-node.handler',
    events: [
      {
        httpApi: {
          method: 'POST',
          path: '/flows/{flowId}/nodes/upscale',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  createRemoveBgNode: {
    handler: 'src/main/functions/nodes/create-remove-bg-node.handler',
    events: [
      {
        httpApi: {
          method: 'POST',
          path: '/flows/{flowId}/nodes/remove-bg',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  updatePromptNode: {
    handler: 'src/main/functions/nodes/update-prompt-node.handler',
    events: [
      {
        httpApi: {
          method: 'PUT',
          path: '/flows/{flowId}/nodes/{nodeId}/prompt',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  updateGenerationNode: {
    handler: 'src/main/functions/nodes/update-generation-node.handler',
    events: [
      {
        httpApi: {
          method: 'PUT',
          path: '/flows/{flowId}/nodes/{nodeId}/generation',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  updateTextToImageNode: {
    handler: 'src/main/functions/nodes/update-text-to-image-node.handler',
    events: [
      {
        httpApi: {
          method: 'PUT',
          path: '/flows/{flowId}/nodes/{nodeId}/text-to-image',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  updateUpscaleNode: {
    handler: 'src/main/functions/nodes/update-upscale-node.handler',
    events: [
      {
        httpApi: {
          method: 'PUT',
          path: '/flows/{flowId}/nodes/{nodeId}/upscale',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  createImageToVideoNode: {
    handler: 'src/main/functions/nodes/create-image-to-video-node.handler',
    events: [
      {
        httpApi: {
          method: 'POST',
          path: '/flows/{flowId}/nodes/image-to-video',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  updateImageToVideoNode: {
    handler: 'src/main/functions/nodes/update-image-to-video-node.handler',
    events: [
      {
        httpApi: {
          method: 'PUT',
          path: '/flows/{flowId}/nodes/{nodeId}/image-to-video',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  createMotionControlNode: {
    handler: 'src/main/functions/nodes/create-motion-control-node.handler',
    events: [
      {
        httpApi: {
          method: 'POST',
          path: '/flows/{flowId}/nodes/motion-control',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  updateMotionControlNode: {
    handler: 'src/main/functions/nodes/update-motion-control-node.handler',
    events: [
      {
        httpApi: {
          method: 'PUT',
          path: '/flows/{flowId}/nodes/{nodeId}/motion-control',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  updateNodePosition: {
    handler: 'src/main/functions/nodes/update-node-position.handler',
    events: [
      {
        httpApi: {
          method: 'PATCH',
          path: '/flows/{flowId}/nodes/{nodeId}/position',
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
  triggerGeneration: {
    handler: 'src/main/functions/nodes/trigger-generation.handler',
    events: [
      {
        httpApi: {
          method: 'POST',
          path: '/flows/{flowId}/nodes/{nodeId}/generate',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  processGeneration: {
    handler: 'src/main/functions/nodes/process-generation.handler',
    memorySize: 256,
    timeout: 30,
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
  falWebhook: {
    handler: 'src/main/functions/nodes/fal-webhook.handler',
    events: [
      {
        httpApi: {
          method: 'POST',
          path: '/webhooks/fal-ai',
        },
      },
    ],
  },
  processFalWebhook: {
    handler: 'src/main/functions/nodes/process-fal-webhook.handler',
    timeout: 300,
    memorySize: 1024,
    events: [
      {
        sqs: {
          arn: {
            'Fn::GetAtt': [
              'FalWebhookQueue',
              'Arn',
            ],
          },
          batchSize: 1,
        },
      },
    ],
  },
  getNodeStatus: {
    handler: 'src/main/functions/nodes/get-node-status.handler',
    events: [
      {
        httpApi: {
          method: 'GET',
          path: '/flows/{flowId}/nodes/{nodeId}/status',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  getNodeMetadata: {
    handler: 'src/main/functions/nodes/get-node-metadata.handler',
    events: [
      {
        httpApi: {
          method: 'GET',
          path: '/flows/{flowId}/nodes/{nodeId}/metadata',
          authorizer: 'MyAuthorizer',
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
  processVideoMetadata: {
    handler: 'src/main/functions/nodes/process-video-metadata.handler',
    memorySize: 512,
    timeout: 60,
    events: [
      {
        s3: {
          bucket: {
            Ref: 'MainBucket',
          },
          event: 's3:ObjectCreated:*',
          existing: true,
          rules: [
            { suffix: '.mp4' },
          ],
        },
      },
      {
        s3: {
          bucket: {
            Ref: 'MainBucket',
          },
          event: 's3:ObjectCreated:*',
          existing: true,
          rules: [
            { suffix: '.webm' },
          ],
        },
      },
      {
        s3: {
          bucket: {
            Ref: 'MainBucket',
          },
          event: 's3:ObjectCreated:*',
          existing: true,
          rules: [
            { suffix: '.mov' },
          ],
        },
      },
    ],
  },
};
