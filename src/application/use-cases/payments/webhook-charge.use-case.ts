import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { AccountBalanceDynamoRepository } from '@infra/database/dynamo/repositories/account-balance-dynamo.repository';
import { Injectable } from '@kernel/decorators/injectable';
import { AppConfig } from '@shared/config/app.config';
import { CreditPricing } from 'src/shared/config/credit-pricing';

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
    private readonly accountRepository: AccountBalanceDynamoRepository,
    private readonly appConfig: AppConfig,
  ) {}

  async execute(payload: WebhookChargeUseCasePayload): Promise<void> {
    if (payload.webhookSecret !== this.appConfig.payments.webhookSecret) {
      console.warn('Invalid webhook secret:', payload.webhookSecret);
      return;
    }

    if (
      !this.verifyAbacateSignature(JSON.stringify(payload.webhookData), payload.xWebhookSignature)
    ) {
      console.warn('Invalid webhook signature');
      return;
    }

    const account = await this.accountRepository.findByAccountId(
      payload.webhookData.data.billing.products[0].externalId,
    );

    if (!account) {
      console.warn(
        'Account not found for externalId:',
        payload.webhookData.data.billing.products[0].externalId,
      );
      return;
    }

    const responseFetchDollar = await fetch(
      `https://economia.awesomeapi.com.br/json/last/USD-BRL?token=${this.appConfig.payments.awesomeapi}`,
    );
    const resultJSON = (await responseFetchDollar.json()) as {
      USDBRL: {
        bid: number;
      };
    };

    const amountInBrl = payload.webhookData.data.billing.amount / 100;
    const amountInUsd = amountInBrl / resultJSON.USDBRL.bid;

    const creditsToAdd = Math.floor(amountInUsd / CreditPricing.usdPerCredit);

    account.updateAttributes({
      balance: account.attrs.balance + creditsToAdd,
      lifetimeDeposited: account.attrs.lifetimeDeposited + creditsToAdd,
    });

    await this.accountRepository.update(account);
  }

  private verifyAbacateSignature(rawBody: string, signatureFromHeader: string) {
    const ABACATEPAY_PUBLIC_KEY =
      't9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9';
    const bodyBuffer = Buffer.from(rawBody, 'utf8');

    const expectedSig = crypto
      .createHmac('sha256', ABACATEPAY_PUBLIC_KEY)
      .update(bodyBuffer)
      .digest('base64');

    const A = Buffer.from(expectedSig);
    const B = Buffer.from(signatureFromHeader);

    return A.length === B.length && crypto.timingSafeEqual(A, B);
  }
}
