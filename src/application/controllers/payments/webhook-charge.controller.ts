import { BaseController } from '@application/contracts/abstracts/base-controller';
import { WebhookChargeUseCase } from '@application/use-cases/payments/webhook-charge.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';

type BillingPaidWebhook = {
  id: string;
  devMode: boolean;
  event: string;
  data: {
    payment: Payment;
    billing: Billing;
  };
};

interface Payment {
  amount: number;
  fee: number;
  method: string;
}

interface Billing {
  amount: number;
  couponsUsed: string[];
  customer: Customer;
  frequency: string;
  id: string;
  kind: string[];
  paidAmount: number;
  products: Product[];
  status: string;
}

interface Customer {
  id: string;
  metadata: CustomerMetadata;
}

interface CustomerMetadata {
  cellphone: string;
  email: string;
  name: string;
  taxId: string;
}

interface Product {
  externalId: string;
  id: string;
  quantity: number;
}

type WebhookChargeControllerQuery = {
  webhookSecret: string;
};

@Injectable()
export class WebhookChargeController extends BaseController<'private'> {
  constructor(private readonly webhookChargeUseCase: WebhookChargeUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'private', BillingPaidWebhook, WebhookChargeControllerQuery>,
  ): Promise<BaseController.Response> {
    console.log(request.headers);

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
