import { Injectable } from '@kernel/decorators/injectable';
import { AppConfig } from '@shared/config/app.config';

@Injectable()
export class AbacatePayGateway {
  constructor(private readonly appConfig: AppConfig) {}

  async generateCharge(
    params: AbacatePayGateway.GenerateChargeInput,
  ): Promise<AbacatePayGateway.GenerateChargeResponse> {
    const response = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.appConfig.payments.abacatePayGateway}`,
      },
      body: JSON.stringify({
        frequency: 'ONE_TIME',
        methods: [
          'PIX',
        ],
        products: [
          {
            externalId: params.accountId,
            name: 'RivoFlow - Créditos',
            quantity: 1,
            price: params.amount * 100,
          },
        ],
        customer: {
          name: params.name,
          cellphone: '',
          email: params.email,
          taxId: '',
        },
        returnUrl: this.appConfig.payments.redirectCancelUrl,
        completionUrl: this.appConfig.payments.redirectSuccessUrl,
        allowCoupons: false,
        coupons: [],
        metadata: {
          rivoFlowAccountId: params.accountId,
        },
      }),
    });

    const result = (await response.json()) as {
      data: {
        url: string;
      };
    };

    return {
      link: result.data.url,
    };
  }
}

export namespace AbacatePayGateway {
  export interface GenerateChargeInput {
    amount: number;
    accountId: string;
    email: string;
    name: string;
  }

  export interface GenerateChargeResponse {
    link: string;
  }
}
