import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * §6.4's two tokens, which are deliberately different kinds of thing.
 *
 * The **access token** is a short-lived JWT the client holds in memory only.
 * It is signed, not stored: verifying it costs no database round trip, which is
 * the entire reason it exists.
 *
 * The **refresh token** is 32 opaque random bytes — not a JWT, because it must
 * be revocable, and a signed token cannot be revoked without the lookup it was
 * meant to avoid. Only its hash is stored, so a database leak does not hand an
 * attacker a working session.
 */

/** 32 bytes of CSPRNG output, base64url. */
export const generateRefreshToken = (): string => randomBytes(32).toString('base64url');

/**
 * SHA-256, deliberately, where passwords get argon2id.
 *
 * A password is low-entropy and guessable, so hashing it must be slow. A
 * refresh token is 256 bits of CSPRNG output and cannot be brute-forced at any
 * speed, so a slow hash would buy nothing and would put an argon2 verification
 * — tens of milliseconds — on the hot path of every token refresh.
 */
export const hashRefreshToken = (token: string): string =>
  createHash('sha256').update(token).digest('base64url');

/**
 * Constant-time comparison, for the places where a hash is compared in code
 * rather than by an indexed database lookup.
 */
export const safeEqual = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  // timingSafeEqual throws on a length mismatch, which would itself leak the
  // length; compare a fixed-size digest of each instead.
  const digestA = createHash('sha256').update(bufA).digest();
  const digestB = createHash('sha256').update(bufB).digest();
  return timingSafeEqual(digestA, digestB);
};

/** Single-use tokens for email verification and password reset (§6.4). */
export const generateVerificationToken = (): string => randomBytes(32).toString('base64url');
export const hashVerificationToken = hashRefreshToken;

/** §6.4: access tokens live 15 minutes, refresh tokens 30 days. */
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
export const VERIFICATION_TOKEN_TTL_SECONDS = 60 * 60;

export const expiryFromNow = (seconds: number, now: Date = new Date()): Date =>
  new Date(now.getTime() + seconds * 1000);
