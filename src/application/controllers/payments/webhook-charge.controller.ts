import { BaseController } from '@application/contracts/abstracts/base-controller';
import {
  BillingPaidWebhook,
  WebhookChargeUseCase,
} from '@application/use-cases/payments/webhook-charge.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';

type WebhookChargeControllerQuery = {
  webhookSecret: string;
};

@Injectable()
export class WebhookChargeController extends BaseController<
  'private',
  unknown,
  BillingPaidWebhook,
  WebhookChargeControllerQuery
> {
  constructor(private readonly webhookChargeUseCase: WebhookChargeUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'private', BillingPaidWebhook, WebhookChargeControllerQuery>,
  ): Promise<BaseController.Response> {
    await this.webhookChargeUseCase.execute({
      webhookData: request.body,
      webhookSecret: request.query.webhookSecret,
      xWebhookSignature: request.headers?.['x-webhook-signature'] || '',
    });

    return {
      statusCode: 201,
    };
  }
}
