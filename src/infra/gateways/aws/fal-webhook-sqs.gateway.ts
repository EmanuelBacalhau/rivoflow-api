import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { sqsClient } from '@infra/clients/sqsClient';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';

@Injectable()
export class FalWebhookSQSGateway {
  constructor(private readonly appConfig: AppConfig) {}

  async publish(params: FalWebhookSQSGateway.PublishParams) {
    const command = new SendMessageCommand({
      QueueUrl: this.appConfig.aws.falWebhookQueueUrl,
      MessageBody: JSON.stringify(params),
    });

    try {
      await sqsClient.send(command);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown SQS error';
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Failed to publish fal webhook message: ${message}`);
    }
  }
}

export namespace FalWebhookSQSGateway {
  export type PublishParams = {
    requestId: string;
    status: 'OK' | 'ERROR';
    payload?: Record<string, unknown>;
    error?: string;
  };
}
