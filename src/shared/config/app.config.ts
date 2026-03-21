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
      databaseUrl: env.DATABASE_URL,
    };

    this.ai = {
      googleGenAiApiKey: env.GOOGLE_GENAI_API_KEY,
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
    googleGenAiApiKey: string;
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
    isProduction: boolean;
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
