import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { ExchangeRateGateway } from '@infra/gateways/payment/exchange-rate.gateway';
import { Injectable } from '@kernel/decorators/injectable';
import { CreditPricing } from '@shared/config/credit-pricing';

interface SimulateCreditsUseCasePayload {
  amountInBrl: number;
}

interface SimulateCreditsUseCaseResult {
  credits: number;
  resultAmountInUsd: number;
}

@Injectable()
export class SimulateCreditsUseCase
  implements IUseCase<SimulateCreditsUseCasePayload, SimulateCreditsUseCaseResult>
{
  constructor(private readonly exchangeRateGateway: ExchangeRateGateway) {}

  async execute(payload: SimulateCreditsUseCasePayload): Promise<SimulateCreditsUseCaseResult> {
    const usdBid = await this.exchangeRateGateway.getUsdBrlExchangeRate();

    const amountInUsd = payload.amountInBrl / usdBid;
    const creditsToAdd = Math.floor(amountInUsd / CreditPricing.usdPerCredit);

    return {
      credits: creditsToAdd,
      resultAmountInUsd: amountInUsd,
    };
  }
}
