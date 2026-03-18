export const dynamoResources = {
  MainTable: {
    Type: 'AWS::DynamoDB::Table',
    Properties: {
      TableName: '${self:service}-${self:provider.stage}-table',
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
        RecoveryPeriodInDays: 35,
      },
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        {
          AttributeName: 'PK',
          AttributeType: 'S',
        },
        {
          AttributeName: 'SK',
          AttributeType: 'S',
        },
        {
          AttributeName: 'GSI1PK1',
          AttributeType: 'S',
        },
        {
          AttributeName: 'GSI1SK1',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'PK',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'SK',
          KeyType: 'RANGE',
        },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI1',
          KeySchema: [
            {
              AttributeName: 'GSI1PK1',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'GSI1SK1',
              KeyType: 'RANGE',
            },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
        },
      ],
    },
  },
};
