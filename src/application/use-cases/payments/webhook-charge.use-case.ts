import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { PaymentSQSGateway } from '@infra/gateways/aws/payment-sqs.gateway';
import { Injectable } from '@kernel/decorators/injectable';
import { AppConfig } from '@shared/config/app.config';

export interface BillingPaidWebhook {
  id: string;
  devMode: boolean;
  event: string;
  data: {
    payment: Payment;
    billing: Billing;
  };
}

export interface Payment {
  amount: number;
  fee: number;
  method: string;
}

export interface Billing {
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

export interface Customer {
  id: string;
  metadata: CustomerMetadata;
}

export interface CustomerMetadata {
  cellphone: string;
  email: string;
  name: string;
  taxId: string;
}

export interface Product {
  externalId: string;
  id: string;
  quantity: number;
}

interface WebhookChargeUseCasePayload {
  webhookSecret: string;
  xWebhookSignature: string;
  webhookData: BillingPaidWebhook;
}

@Injectable()
export class WebhookChargeUseCase implements IUseCase<WebhookChargeUseCasePayload, void> {
  constructor(
    private readonly appConfig: AppConfig,
    private readonly paymentSQSGateway: PaymentSQSGateway,
  ) {}

  async execute(payload: WebhookChargeUseCasePayload): Promise<void> {
    if (payload.webhookSecret !== this.appConfig.payments.webhookSecret) {
      console.warn('[WebhookCharge] Invalid webhook secret');
      return;
    }

    if (
      !this.verifyAbacateSignature(JSON.stringify(payload.webhookData), payload.xWebhookSignature)
    ) {
      console.warn('[WebhookCharge] Invalid webhook signature');
      return;
    }

    await this.paymentSQSGateway.publish({
      webhookData: payload.webhookData,
    });
  }

  private verifyAbacateSignature(rawBody: string, signatureFromHeader: string) {
    const bodyBuffer = Buffer.from(rawBody, 'utf8');

    const expectedSig = crypto
      .createHmac('sha256', this.appConfig.payments.abacatePayPublicKey)
      .update(bodyBuffer)
      .digest('base64');

    const A = Buffer.from(expectedSig);
    const B = Buffer.from(signatureFromHeader);

    return A.length === B.length && crypto.timingSafeEqual(A, B);
  }
}
