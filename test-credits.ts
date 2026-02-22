import { calculateCreditsRequired } from './src/shared/utils/credit-calculator';

console.log('1K:', calculateCreditsRequired({ promptTokens: 100, imageTokens: 0, quality: '1K' as any }));
console.log('2K:', calculateCreditsRequired({ promptTokens: 100, imageTokens: 0, quality: '2K' as any }));
console.log('4K:', calculateCreditsRequired({ promptTokens: 100, imageTokens: 0, quality: '4K' as any }));
console.log('Empty quality:', calculateCreditsRequired({ promptTokens: 100, imageTokens: 0, quality: '' as any }));

