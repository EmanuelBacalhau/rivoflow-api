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
        'Fn::GetAtt': ['ImageQueue', 'Arn'],
      },
      {
        'Fn::GetAtt': ['FalWebhookQueue', 'Arn'],
      },
    ],
  },
];
