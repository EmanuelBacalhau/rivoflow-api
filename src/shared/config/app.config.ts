import { Injectable } from 'src/kernel/decorators/injectable';
import { env } from './env';

@Injectable()
export class AppConfig {
  readonly database: AppConfig.Database;
  readonly ai: AppConfig.AI;
  readonly aws: AppConfig.Aws;

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
  };
}
