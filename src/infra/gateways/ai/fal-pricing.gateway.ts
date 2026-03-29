import { QualityEnum } from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const FAL_API_BASE = 'https://api.fal.ai/v1';

const QUALITY_MULTIPLIER: Record<QualityEnum, number> = {
  [QualityEnum['0.5K']]: 0.75,
  [QualityEnum['1K']]: 1.0,
  [QualityEnum['2K']]: 1.5,
  [QualityEnum['4K']]: 2.0,
};

type CacheEntry = {
  unitPrice: number;
  fetchedAt: number;
};

@Injectable()
export class FalPricingGateway {
  private cache = new Map<string, CacheEntry>();

  constructor(private readonly appConfig: AppConfig) {}

  async getUnitPrice(endpointId: string): Promise<number> {
    const cached = this.cache.get(endpointId);

    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return cached.unitPrice;
    }

    const url = `${FAL_API_BASE}/models/pricing?endpoint_id=${encodeURIComponent(endpointId)}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Key ${this.appConfig.ai.falKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as FalPricingGateway.PricingResponse;

      const price = data.prices.find((p) => p.endpoint_id === endpointId);

      if (!price) {
        throw new Error(`No pricing found for ${endpointId}`);
      }

      this.cache.set(endpointId, {
        unitPrice: price.unit_price,
        fetchedAt: Date.now(),
      });

      return price.unit_price;
    } catch (error) {
      if (cached) {
        return cached.unitPrice;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ApplicationError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `Failed to fetch fal.ai pricing: ${message}`,
      );
    }
  }

  async getCostForQuality(endpointId: string, quality: QualityEnum): Promise<number> {
    const unitPrice = await this.getUnitPrice(endpointId);
    return unitPrice * QUALITY_MULTIPLIER[quality];
  }
}

export namespace FalPricingGateway {
  export type PricingEntry = {
    endpoint_id: string;
    unit_price: number;
    unit: string;
    currency: string;
  };

  export type PricingResponse = {
    prices: PricingEntry[];
    next_cursor: string | null;
    has_more: boolean;
  };
}
