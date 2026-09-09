import { CURRENCY_EXPONENTS, type CurrencyCode } from '@centiverse/core';

/**
 * Static reference data for currency pickers. Not ledger data, so it does not
 * belong behind the DataPort -- but it must not come from utils/mockData either,
 * which the Phase 3 exit criteria confine to the mock adapter.
 *
 * Names and symbols are presentation; the exponents are the domain's.
 */
const NAMES: Partial<Record<CurrencyCode, { name: string; symbol: string }>> = {
  INR: { name: 'Indian Rupee', symbol: '₹' },
  USD: { name: 'US Dollar', symbol: '$' },
  EUR: { name: 'Euro', symbol: '€' },
  GBP: { name: 'British Pound', symbol: '£' },
  JPY: { name: 'Japanese Yen', symbol: '¥' },
  AUD: { name: 'Australian Dollar', symbol: 'A$' },
  CAD: { name: 'Canadian Dollar', symbol: 'C$' },
  SGD: { name: 'Singapore Dollar', symbol: 'S$' },
  AED: { name: 'UAE Dirham', symbol: 'د.إ' },
  THB: { name: 'Thai Baht', symbol: '฿' },
};

export const SUPPORTED_CURRENCIES = (Object.keys(CURRENCY_EXPONENTS) as CurrencyCode[])
  .filter((code) => NAMES[code] !== undefined)
  .map((code) => ({
    code,
    name: NAMES[code]!.name,
    symbol: NAMES[code]!.symbol,
    exponent: CURRENCY_EXPONENTS[code],
  }));
