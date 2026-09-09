/** Thrown: constructing an invalid Money is a programmer error, not user input. */
export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyError';
  }
}

export type ParseErrorCode =
  | 'EMPTY'
  | 'NOT_A_NUMBER'
  | 'TOO_MANY_DECIMALS'
  | 'AMBIGUOUS_SEPARATORS'
  | 'NOT_FINITE';

export interface ParseError {
  readonly code: ParseErrorCode;
  readonly message: string;
  readonly input: string;
}

export type SplitErrorCode =
  | 'NO_PARTICIPANTS'
  | 'DUPLICATE_PARTICIPANT'
  | 'CURRENCY_MISMATCH'
  | 'TOTAL_NOT_POSITIVE'
  | 'PAYERS_DO_NOT_SUM'
  | 'SHARES_DO_NOT_SUM'
  | 'BPS_DO_NOT_SUM'
  | 'WEIGHTS_NOT_POSITIVE'
  | 'NEGATIVE_SHARE'
  | 'UNCLAIMED_ITEMS'
  | 'RECONCILIATION_FAILED';

export interface SplitError {
  readonly code: SplitErrorCode;
  readonly message: string;
}

export const splitError = (code: SplitErrorCode, message: string): SplitError => ({ code, message });
