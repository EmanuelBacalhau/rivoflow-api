export const iamStatements = [
  {
    Effect: 'Allow',
    Action: [
      's3:PutObject',
      's3:GetObject',
      's3:DeleteObject',
      's3:DeleteObjects',
    ],
    Resource: {
      'Fn::Sub': '${MainBucket.Arn}/*',
    },
  },
  {
    Effect: 'Allow',
    Action: [
      'sqs:SendMessage',
    ],
    Resource: [
      {
        'Fn::GetAtt': [
          'ImageQueue',
          'Arn',
        ],
      },
      {
        'Fn::GetAtt': [
          'FalWebhookQueue',
          'Arn',
        ],
      },
      {
        'Fn::GetAtt': [
          'DLQPaymentQueue',
          'Arn',
        ],
      },
    ],
  },
  {
    Effect: 'Allow',
    Action: [
      'lambda:InvokeFunction',
    ],
    Resource: [
      {
        'Fn::Sub':
          'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:${self:service}-${self:provider.stage}-processPayment',
      },
    ],
  },
];
