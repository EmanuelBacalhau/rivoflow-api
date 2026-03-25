import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { AccountTransactionEntity } from '@application/entities/account-transaction.entity';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { AccountBalanceDrizzleRepository } from '@infra/database/drizzle/repositories/account-balance-drizzle.repository';
import { AccountTransactionDrizzleRepository } from '@infra/database/drizzle/repositories/account-transaction-drizzle.repository';
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
    private readonly accountRepository: AccountBalanceDrizzleRepository,
    private readonly transactionRepository: AccountTransactionDrizzleRepository,
    private readonly appConfig: AppConfig,
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

    const products = payload.webhookData.data.billing.products;

    if (!products?.length) {
      console.warn('[WebhookCharge] No products in billing');
      return;
    }

    const accountId = products[0].externalId;
    const account = await this.accountRepository.findByAccountId(accountId);

    if (!account) {
      console.warn('[WebhookCharge] Account not found');
      return;
    }

    const responseFetchDollar = await fetch(
      `https://economia.awesomeapi.com.br/json/last/USD-BRL?token=${this.appConfig.payments.awesomeapi}`,
    );

    if (!responseFetchDollar.ok) {
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'Failed to fetch USD-BRL exchange rate');
    }

    const resultJSON = (await responseFetchDollar.json()) as {
      USDBRL: { bid: number };
    };

    if (!resultJSON.USDBRL?.bid) {
      throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'Invalid exchange rate response');
    }

    const amountInBrl = payload.webhookData.data.billing.amount / 100;
    const amountInUsd = amountInBrl / resultJSON.USDBRL.bid;

    const creditsToAdd = Math.floor(amountInUsd / CreditPricing.usdPerCredit);

    account.updateAttributes({
      balance: account.attrs.balance + creditsToAdd,
      lifetimeDeposited: account.attrs.lifetimeDeposited + creditsToAdd,
    });

    await this.accountRepository.update(account);

    await this.transactionRepository.save(
      new AccountTransactionEntity({
        accountId,
        type: AccountTransactionEntity.Type.DEPOSIT,
        credits: creditsToAdd,
        metadata: {
          amountBrl: amountInBrl,
          amountUsd: amountInUsd,
          exchangeRate: resultJSON.USDBRL.bid,
          paymentMethod: payload.webhookData.data.payment.method,
          billingId: payload.webhookData.data.billing.id,
        },
      }),
    );
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
