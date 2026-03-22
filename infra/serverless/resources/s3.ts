export const s3Resources = {
  MainBucket: {
    Type: 'AWS::S3::Bucket',
    Properties: {
      BucketName: '${self:service}-${self:provider.stage}-${self:provider.region}-bucket',
      LifecycleConfiguration: {
        Rules: [
          {
            Id: 'DeleteTmpAfter1Day',
            Status: 'Enabled',
            Prefix: 'tmp/',
            ExpirationInDays: 1,
          },
        ],
      },
      CorsConfiguration: {
        CorsRules: [
          {
            AllowedMethods: [
              'GET',
              'PUT',
              'POST',
            ],
            AllowedOrigins: [
              '${env:FRONTEND_URL}',
            ],
            AllowedHeaders: [
              '*',
            ],
          },
        ],
      },
    },
  },
};
