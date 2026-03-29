import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { AccountTransactionEntity } from '@application/entities/account-transaction.entity';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { AccountBalanceDrizzleRepository } from '@infra/database/drizzle/repositories/account-balance-drizzle.repository';
import { AccountTransactionDrizzleRepository } from '@infra/database/drizzle/repositories/account-transaction-drizzle.repository';
import { Injectable } from '@kernel/decorators/injectable';
import { AppConfig } from '@shared/config/app.config';
import { CreditPricing } from 'src/shared/config/credit-pricing';
import { BillingPaidWebhook } from './webhook-charge.use-case';

@Injectable()
export class ProcessPaymentUseCase implements IUseCase<BillingPaidWebhook, void> {
  constructor(
    private readonly accountRepository: AccountBalanceDrizzleRepository,
    private readonly transactionRepository: AccountTransactionDrizzleRepository,
    private readonly appConfig: AppConfig,
  ) {}

  async execute(webhookData: BillingPaidWebhook): Promise<void> {
    const products = webhookData.data.billing.products;

    if (!products?.length) {
      console.warn('[ProcessPayment] No products in billing');
      return;
    }

    const accountId = products[0].externalId;
    const account = await this.accountRepository.findByAccountId(accountId);

    if (!account) {
      console.warn('[ProcessPayment] Account not found');
      return;
    }

    const responseFetchDollar = await fetch(
      `https://economia.awesomeapi.com.br/json/last/USD-BRL?token=${this.appConfig.payments.awesomeapi}`,
    );

    if (!responseFetchDollar.ok) {
      throw new ApplicationError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        'Failed to fetch USD-BRL exchange rate',
      );
    }

    const resultJSON = (await responseFetchDollar.json()) as {
      USDBRL: {
        bid: number;
      };
    };

    if (!resultJSON.USDBRL?.bid) {
      throw new ApplicationError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        'Invalid exchange rate response',
      );
    }

    const amountInBrl = webhookData.data.billing.amount / 100;
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
          paymentMethod: webhookData.data.payment.method,
          billingId: webhookData.data.billing.id,
        },
      }),
    );
  }
}
