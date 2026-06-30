import { CURRENCY_RATES } from './i18n';

export function formatPrice(
  amountUsd: number,
  currency: string = 'USD',
  symbol: string = '$'
): string {
  const rate = CURRENCY_RATES[currency] ?? 1;
  const converted = amountUsd * rate;

  if (currency === 'KHR') {
    return `${Math.round(converted).toLocaleString()} ៛`;
  }
  if (currency === 'EUR') {
    return `€${converted.toFixed(2)}`;
  }
  return `${symbol}${converted.toFixed(2)}`;
}
