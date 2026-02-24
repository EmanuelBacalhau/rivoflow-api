import { Injectable } from '@kernel/decorators/injectable';
import { AppConfig } from '@shared/config/app.config';

interface AwesomeApiResponse {
  USDBRL: {
    bid: string | number;
  };
}

@Injectable()
export class ExchangeRateGateway {
  constructor(private readonly appConfig: AppConfig) {}

  async getUsdBrlExchangeRate(): Promise<number> {
    try {
      const response = await fetch(
        `https://economia.awesomeapi.com.br/json/last/USD-BRL?token=${this.appConfig.payments.awesomeapi}`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch exchange rate');
      }

      const data = (await response.json()) as AwesomeApiResponse;

      const bid =
        typeof data.USDBRL.bid === 'string' ? parseFloat(data.USDBRL.bid) : data.USDBRL.bid;

      if (Number.isNaN(bid)) {
        throw new Error('Invalid bid value');
      }

      return bid;
    } catch (error) {
      console.error('[ExchangeRateGateway] Error fetching USD-BRL exchange rate:', error);

      // Fallback de segurança (Cotação aproximada do dólar)
      // para garantir que o sistema não pare se a API externa cair
      return 5.8;
    }
  }
}
