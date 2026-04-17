import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { InvokeCommand } from '@aws-sdk/client-lambda';
import { lambdaClient } from '@infra/clients/lambdaClient';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';

@Injectable()
export class PaymentLambdaGateway {
  constructor(private readonly appConfig: AppConfig) {}

  async publish(params: PaymentLambdaGateway.PublishParams) {
    const command = new InvokeCommand({
      FunctionName: this.appConfig.aws.processPaymentFunctionName,
      InvocationType: 'Event',
      Payload: Buffer.from(JSON.stringify(params)),
    });

    try {
      await lambdaClient.send(command);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Lambda error';
      throw new ApplicationError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `Failed to invoke process payment lambda: ${message}`,
      );
    }
  }
}

export namespace PaymentLambdaGateway {
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
