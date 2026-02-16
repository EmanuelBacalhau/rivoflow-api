import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { sqsClient } from '@infra/clients/sqsClient';
import { Injectable } from 'src/kernel/decorators/injectable';

@Injectable()
export class ImageSQSGateway {
  async publish(params: ImageSQSGateway.PublishParams) {
    const messageBody = JSON.stringify(params);

    const command = new SendMessageCommand({
      QueueUrl: process.env.IMAGE_QUEUE_URL!,
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
}
