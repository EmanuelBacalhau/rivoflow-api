import { Injectable } from 'src/kernel/decorators/injectable';
import { env } from './env';

@Injectable()
export class AppConfig {
  readonly database: AppConfig.Database;
  readonly ai: AppConfig.AI;
  readonly aws: AppConfig.Aws;
  readonly app: AppConfig.Environment;
  readonly payments: AppConfig.Payments;

  constructor() {
    this.database = {
      dynamoTable: env.DYNAMO_TABLE,
    };

    this.ai = {
      nanobananaApiKey: env.GOOGLE_GENAI_API_KEY,
    };

    this.aws = {
      bucketName: env.RIVO_FLOW_BUCKET,
      imageQueueUrl: env.IMAGE_QUEUE_URL,
      cognito: {
        clientId: env.COGNITO_CLIENT_ID,
        clientSecret: env.COGNITO_CLIENT_SECRET,
        poolDomain: env.COGNITO_POOL_DOMAIN,
      },
      cdnDomainName: env.CDN_DOMAIN_NAME,
    };

    this.app = {
      isProduction: env.IS_PRODUCTION,
    };

    this.payments = {
      abacatePayGateway: env.ABACATE_PAY_GATEWAY,
      redirectSuccessUrl: env.REDIRECT_SUCCESS_URL,
      redirectCancelUrl: env.REDIRECT_CANCEL_URL,
      webhookSecret: env.WEBHOOK_SECRET,
    };
  }
}

export namespace AppConfig {
  export type Database = {
    dynamoTable: string;
  };

  export type AI = {
    nanobananaApiKey: string;
  };

  export type Aws = {
    bucketName: string;
    imageQueueUrl: string;
    cognito: {
      clientId: string;
      clientSecret: string;
      poolDomain: string;
    };
    cdnDomainName: string;
  };

  export type Environment = {
    isProduction: string;
  };

  export type Payments = {
    abacatePayGateway: string;
    redirectSuccessUrl: string;
    redirectCancelUrl: string;
    webhookSecret: string;
  };
}
