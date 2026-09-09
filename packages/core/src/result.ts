/**
 * A tiny Result type. The domain uses exceptions only for programmer errors
 * (constructing a Money from a non-integer); anything a *user* can cause is
 * returned as a value so callers must handle it.
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const isOk = <T, E>(r: Result<T, E>): r is { ok: true; value: T } => r.ok;
export const isErr = <T, E>(r: Result<T, E>): r is { ok: false; error: E } => !r.ok;

/** Unwraps, throwing on error. For tests and call sites that have already validated. */
export const unwrap = <T, E>(r: Result<T, E>): T => {
  if (!r.ok) throw new Error(`unwrap() on an error Result: ${JSON.stringify(r.error)}`);
  return r.value;
};
