import { isCurrencyCode, money, type CurrencyCode, type Money } from '@centiverse/core';
import type { MoneyDto } from '@centiverse/contracts';
import { ApiError } from './problem';

/**
 * The wire/domain boundary for money, as distinct from `db/money.ts`, which is
 * the database boundary.
 *
 * `MoneySchema` guarantees `minor` is a safe integer and `currency` is three
 * characters, but its inferred `currency` type is a plain `string` — the enum is
 * built from `CURRENCY_EXPONENTS` at runtime. Narrowing it to `CurrencyCode` is
 * this function's job, and it fails loudly rather than casting.
 */
export const toDomainMoney = (dto: MoneyDto, field = 'amount'): Money => {
  if (!isCurrencyCode(dto.currency)) {
    throw ApiError.validation({ [field]: [`unsupported currency "${dto.currency}"`] });
  }
  return money(dto.minor, dto.currency);
};

export const asCurrencyCode = (raw: string, field = 'currency'): CurrencyCode => {
  const trimmed = raw.trim();
  if (!isCurrencyCode(trimmed)) {
    throw ApiError.validation({ [field]: [`unsupported currency "${raw}"`] });
  }
  return trimmed;
};

/** Money is plain data on the wire, so the DTO form is the domain form. */
export const toMoneyDto = (value: Money): MoneyDto => ({
  minor: value.minor,
  currency: value.currency,
});
