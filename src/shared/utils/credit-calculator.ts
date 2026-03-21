import { CreditPricing } from '../config/credit-pricing';

/**
 * Calculates credits from a USD cost (used both for estimation and exact billing).
 */
export function calculateCreditsFromCost(costUsd: number): number {
  const totalWithMarkup = costUsd * CreditPricing.markupMultiplier;
  return Math.ceil(totalWithMarkup / CreditPricing.usdPerCredit);
}
