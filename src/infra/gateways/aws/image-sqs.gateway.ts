import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
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

    try {
      await sqsClient.send(command);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown SQS error';
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR,`Failed to publish message to queue: ${message}`);
    }
  }
}

export namespace ImageSQSGateway {
  export type PublishParams = {
    flowId: string;
    nodeGeneratorId: string;
    inputs: string[];
    accountId: string;
  };
}
