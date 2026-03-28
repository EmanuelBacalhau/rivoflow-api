export const environment = {
  DATABASE_URL: '${env:DATABASE_URL}',
  RIVO_FLOW_BUCKET: {
    Ref: 'MainBucket',
  },
  GENERATION_QUEUE_URL: {
    Ref: 'ImageQueue',
  },
  FAL_KEY: '${env:FAL_KEY}',
  FAL_WEBHOOK_SECRET: '${env:FAL_WEBHOOK_SECRET}',
  FAL_WEBHOOK_BASE_URL: '${env:FAL_WEBHOOK_BASE_URL}',
  COGNITO_CLIENT_ID: {
    Ref: 'UserPoolClient',
  },
  COGNITO_CLIENT_SECRET: {
    'Fn::GetAtt': [
      'UserPoolClient',
      'ClientSecret',
    ],
  },
  COGNITO_POOL_DOMAIN: {
    'Fn::Sub': 'https://${UserPoolDomain}.auth.${AWS::Region}.amazoncognito.com',
  },
  USER_POOL_ID: {
    Ref: 'UserPool',
  },
  CDN_DOMAIN_NAME: '${env:CDN_DOMAIN_NAME}',
  REGION: '${self:provider.region}',
  FAL_WEBHOOK_QUEUE_URL: {
    Ref: 'FalWebhookQueue',
  },
  ABACATE_PAY_GATEWAY: '${env:ABACATE_PAY_GATEWAY}',
  ABACATE_PAY_PUBLIC_KEY: '${env:ABACATE_PAY_PUBLIC_KEY}',
  REDIRECT_SUCCESS_URL: '${env:REDIRECT_SUCCESS_URL}',
  REDIRECT_CANCEL_URL: '${env:REDIRECT_CANCEL_URL}',
  WEBHOOK_SECRET: '${env:WEBHOOK_SECRET}',
  AWESOMEAPI_KEY: '${env:AWESOMEAPI_KEY}',
  PAYMENT_QUEUE_URL: {
    Ref: 'PaymentQueue',
  },
};
