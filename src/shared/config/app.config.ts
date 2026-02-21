import { Injectable } from 'src/kernel/decorators/injectable';
import { env } from './env';

@Injectable()
export class AppConfig {
  readonly database: AppConfig.Database;
  readonly ai: AppConfig.AI;
  readonly aws: AppConfig.Aws;
  readonly app: AppConfig.Environment;

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
}
