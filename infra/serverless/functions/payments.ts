import type { Functions } from '../types';

export const paymentFunctions: Functions = {
  createLinkCharge: {
    handler: 'src/main/functions/payments/create-link-charge.handler',
    events: [
      {
        httpApi: {
          method: 'POST',
          path: '/payments/link-charge',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  webhookCharge: {
    handler: 'src/main/functions/payments/webhook-charge.handler',
    events: [
      {
        httpApi: {
          method: 'POST',
          path: '/payments/webhook-charge',
        },
      },
    ],
  },
  simulateCredits: {
    handler: 'src/main/functions/payments/simulate-credits.handler',
    events: [
      {
        httpApi: {
          method: 'GET',
          path: '/payments/simulate-credits',
          authorizer: 'MyAuthorizer',
        },
      },
    ],
  },
  processPayment: {
    handler: 'src/main/functions/payments/process-payment.handler',
    timeout: 60,
    memorySize: 256,
    maximumRetryAttempts: 2,
    destinations: {
      onFailure: {
        type: 'sqs',
        arn: {
          'Fn::GetAtt': [
            'DLQPaymentQueue',
            'Arn',
          ],
        },
      },
    },
  },
};
