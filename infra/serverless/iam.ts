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
      'dynamodb:PutItem',
      'dynamodb:GetItem',
      'dynamodb:UpdateItem',
      'dynamodb:DeleteItem',
      'dynamodb:Query',
      'dynamodb:BatchWriteItem',
      'dynamodb:BatchGetItem',
      'dynamodb:TransactWriteItems',
    ],
    Resource: [
      {
        'Fn::GetAtt': [
          'MainTable',
          'Arn',
        ],
      },
      {
        'Fn::Sub': '${MainTable.Arn}/index/*',
      },
    ],
  },
  {
    Effect: 'Allow',
    Action: [
      'sqs:SendMessage',
    ],
    Resource: {
      'Fn::GetAtt': [
        'ImageQueue',
        'Arn',
      ],
    },
  },
];
