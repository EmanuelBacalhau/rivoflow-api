import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { sqsClient } from '@infra/clients/sqsClient';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';

@Injectable()
export class ImageSQSGateway {
  constructor(private readonly appConfig: AppConfig) {}

  async publish(params: ImageSQSGateway.PublishParams) {
    const messageBody = JSON.stringify(params);

    const command = new SendMessageCommand({
      QueueUrl: this.appConfig.aws.imageQueueUrl,
      MessageBody: messageBody,
    });

    await sqsClient.send(command);
  }
}

export namespace ImageSQSGateway {
  export interface PublishParams {
    flowId: string;
    nodeGeneratorId: string;
    inputs: string[];
  }

  export type Message = {
    flowId: string;
    nodeGeneratorId: string;
    inputs: string[];
  };
}
