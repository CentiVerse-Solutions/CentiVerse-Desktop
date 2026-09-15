import { describe, expect, it } from 'vitest';
import { ARGON2_OPTIONS, hashPassword, needsRehash, verifyPassword } from '../src/lib/password';
import {
  generateRefreshToken,
  hashRefreshToken,
  safeEqual,
  expiryFromNow,
  ACCESS_TOKEN_TTL_SECONDS,
} from '../src/lib/tokens';

describe('password hashing (§6.4)', () => {
  it('uses argon2id at the OWASP baseline', async () => {
    expect(ARGON2_OPTIONS.memoryCost).toBe(19_456);
    expect(ARGON2_OPTIONS.timeCost).toBe(2);
    expect(ARGON2_OPTIONS.parallelism).toBe(1);

    const stored = await hashPassword('correct horse battery staple');
    expect(stored).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  });

  it('accepts the right password and rejects the wrong one', async () => {
    const stored = await hashPassword('correct horse battery staple');
    await expect(verifyPassword(stored, 'correct horse battery staple')).resolves.toBe(true);
    await expect(verifyPassword(stored, 'Correct horse battery staple')).resolves.toBe(false);
  });

  it('salts, so the same password hashes differently every time', async () => {
    const a = await hashPassword('same password');
    const b = await hashPassword('same password');
    expect(a).not.toBe(b);
    await expect(verifyPassword(a, 'same password')).resolves.toBe(true);
    await expect(verifyPassword(b, 'same password')).resolves.toBe(true);
  });

  it('reads a corrupted stored hash as a wrong password, not as a crash', async () => {
    await expect(verifyPassword('not-a-hash', 'anything')).resolves.toBe(false);
    await expect(verifyPassword('', 'anything')).resolves.toBe(false);
  });

  it('flags hashes made with weaker parameters for rehashing', () => {
    expect(needsRehash('$argon2id$v=19$m=19456,t=2,p=1$abc$def')).toBe(false);
    expect(needsRehash('$argon2id$v=19$m=4096,t=2,p=1$abc$def')).toBe(true);
    expect(needsRehash('$argon2id$v=19$m=19456,t=1,p=1$abc$def')).toBe(true);
    expect(needsRehash('$2b$10$somethingbcryptish')).toBe(true);
  });
});

describe('refresh tokens (§6.4)', () => {
  it('generates 256 bits of entropy, unpredictably', () => {
    const tokens = new Set(Array.from({ length: 200 }, () => generateRefreshToken()));
    expect(tokens.size).toBe(200);
    // 32 bytes base64url-encoded, unpadded.
    expect(generateRefreshToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('hashes deterministically, so the stored hash can be looked up by index', () => {
    const token = generateRefreshToken();
    expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
    expect(hashRefreshToken(token)).not.toBe(token);
    expect(hashRefreshToken(token)).not.toBe(hashRefreshToken(generateRefreshToken()));
  });

  it('compares without leaking length through an exception', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(() => safeEqual('short', 'considerably longer')).not.toThrow();
    expect(safeEqual('short', 'considerably longer')).toBe(false);
  });

  it('computes expiry from the clock it is given', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    expect(expiryFromNow(ACCESS_TOKEN_TTL_SECONDS, now).toISOString()).toBe(
      '2026-01-01T00:15:00.000Z',
    );
  });
});
