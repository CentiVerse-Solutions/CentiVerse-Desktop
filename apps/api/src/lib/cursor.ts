import { ApiError } from './problem';

/**
 * §6.3: "Cursor pagination (opaque, encodes `(created_at, id)`). Never OFFSET —
 * the activity feed will grow."
 *
 * OFFSET is wrong here for two reasons, not one. It gets slower as the offset
 * grows, and it silently skips or repeats rows when something is inserted while
 * a client is paging — which for an append-heavy feed is the normal case, not
 * an edge case. A keyset cursor has neither problem.
 *
 * The encoding is base64url of `<iso timestamp>|<uuid>`. Opaque to the client by
 * convention, not by cryptography: it carries no secret, only a position the
 * caller could have derived from the page it already holds.
 */

export interface Cursor {
  timestamp: Date;
  id: string;
}

export const encodeCursor = (timestamp: Date, id: string): string =>
  Buffer.from(`${timestamp.toISOString()}|${id}`, 'utf8').toString('base64url');

export const decodeCursor = (raw: string): Cursor => {
  const decoded = Buffer.from(raw, 'base64url').toString('utf8');
  const separator = decoded.indexOf('|');
  if (separator === -1) {
    throw ApiError.validation({ cursor: ['not a valid cursor'] });
  }

  const timestamp = new Date(decoded.slice(0, separator));
  const id = decoded.slice(separator + 1);

  if (Number.isNaN(timestamp.getTime()) || id === '') {
    throw ApiError.validation({ cursor: ['not a valid cursor'] });
  }

  return { timestamp, id };
};

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

export const parseLimit = (raw: string | undefined): number => {
  if (raw === undefined) return DEFAULT_PAGE_SIZE;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > MAX_PAGE_SIZE) {
    throw ApiError.validation({ limit: [`must be an integer between 1 and ${MAX_PAGE_SIZE}`] });
  }
  return value;
};

/**
 * Fetches one more row than asked for: if it comes back, there is another page
 * and the extra row tells us where it starts. Avoids a second COUNT query whose
 * answer would be stale by the time it is used.
 */
export const takePage = <T>(
  rows: T[],
  limit: number,
  cursorOf: (row: T) => string,
): { items: T[]; nextCursor: string | null } => {
  if (rows.length <= limit) return { items: rows, nextCursor: null };
  const items = rows.slice(0, limit);
  return { items, nextCursor: cursorOf(items[items.length - 1]!) };
};
