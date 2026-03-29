import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { sqsClient } from '@infra/clients/sqsClient';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';

@Injectable()
export class PaymentSQSGateway {
  constructor(private readonly appConfig: AppConfig) {}

  async publish(params: PaymentSQSGateway.PublishParams) {
    const messageBody = JSON.stringify(params);

    const command = new SendMessageCommand({
      QueueUrl: this.appConfig.aws.paymentQueueUrl,
      MessageBody: messageBody,
    });

    try {
      await sqsClient.send(command);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown SQS error';
      throw new ApplicationError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `Failed to publish message to payment queue: ${message}`,
      );
    }
  }
}

export namespace PaymentSQSGateway {
  export type PublishParams = {
    webhookData: {
      id: string;
      devMode: boolean;
      event: string;
      data: {
        payment: {
          amount: number;
          fee: number;
          method: string;
        };
        billing: {
          amount: number;
          couponsUsed: string[];
          customer: {
            id: string;
            metadata: {
              cellphone: string;
              email: string;
              name: string;
              taxId: string;
            };
          };
          frequency: string;
          id: string;
          kind: string[];
          paidAmount: number;
          products: {
            externalId: string;
            id: string;
            quantity: number;
          }[];
          status: string;
        };
      };
    };
  };
}
