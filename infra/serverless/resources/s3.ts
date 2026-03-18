export const s3Resources = {
  MainBucket: {
    Type: 'AWS::S3::Bucket',
    Properties: {
      BucketName: '${self:service}-${self:provider.stage}-${self:provider.region}-bucket',
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
