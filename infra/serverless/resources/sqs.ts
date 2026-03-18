export const sqsResources = {
  ImageQueue: {
    Type: 'AWS::SQS::Queue',
    Properties: {
      QueueName: '${self:service}-${self:provider.stage}-image-queue',
      VisibilityTimeout: 360,
      ReceiveMessageWaitTimeSeconds: 20,
      RedrivePolicy: {
        maxReceiveCount: 3,
        deadLetterTargetArn: {
          'Fn::GetAtt': [
            'DLQImageQueue',
            'Arn',
          ],
        },
      },
    },
  },

  DLQImageQueue: {
    Type: 'AWS::SQS::Queue',
    Properties: {
      QueueName: '${self:service}-${self:provider.stage}-image-dlq',
      MessageRetentionPeriod: 1209600,
    },
  },
};
