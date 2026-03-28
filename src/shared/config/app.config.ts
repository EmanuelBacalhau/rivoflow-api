import { Injectable } from 'src/kernel/decorators/injectable';
import { env } from './env';

@Injectable()
export class AppConfig {
  readonly database: AppConfig.Database;
  readonly ai: AppConfig.AI;
  readonly aws: AppConfig.Aws;
  readonly payments: AppConfig.Payments;

  constructor() {
    this.database = {
      databaseUrl: env.DATABASE_URL,
    };

    this.ai = {
      falKey: env.FAL_KEY,
      falWebhookSecret: env.FAL_WEBHOOK_SECRET,
      falWebhookBaseUrl: env.FAL_WEBHOOK_BASE_URL,
    };

    this.aws = {
      bucketName: env.RIVO_FLOW_BUCKET,
      generationQueueUrl: env.GENERATION_QUEUE_URL,
      falWebhookQueueUrl: env.FAL_WEBHOOK_QUEUE_URL,
      paymentQueueUrl: env.PAYMENT_QUEUE_URL,
      cognito: {
        clientId: env.COGNITO_CLIENT_ID,
        clientSecret: env.COGNITO_CLIENT_SECRET,
        poolDomain: env.COGNITO_POOL_DOMAIN,
      },
      cdnDomainName: env.CDN_DOMAIN_NAME,
    };

    this.payments = {
      abacatePayGateway: env.ABACATE_PAY_GATEWAY,
      abacatePayPublicKey: env.ABACATE_PAY_PUBLIC_KEY,
      redirectSuccessUrl: env.REDIRECT_SUCCESS_URL,
      redirectCancelUrl: env.REDIRECT_CANCEL_URL,
      webhookSecret: env.WEBHOOK_SECRET,
      awesomeapi: env.AWESOMEAPI_KEY,
    };
  }
}

export namespace AppConfig {
  export type Database = {
    databaseUrl: string;
  };

  export type AI = {
    falKey: string;
    falWebhookSecret: string;
    falWebhookBaseUrl: string;
  };

  export type Aws = {
    bucketName: string;
    generationQueueUrl: string;
    falWebhookQueueUrl: string;
    paymentQueueUrl: string;
    cognito: {
      clientId: string;
      clientSecret: string;
      poolDomain: string;
    };
    cdnDomainName: string;
  };

  export type Payments = {
    abacatePayGateway: string;
    abacatePayPublicKey: string;
    redirectSuccessUrl: string;
    redirectCancelUrl: string;
    webhookSecret: string;
    awesomeapi: string;
  };
}
