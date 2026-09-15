import { hash, verify } from '@node-rs/argon2';

/**
 * @node-rs/argon2 exports `Algorithm` as an ambient const enum, which
 * `isolatedModules` forbids importing. Argon2id is 2. The test asserting the
 * stored hash starts with `$argon2id$` is what keeps this honest.
 */
const ARGON2ID = 2;

/**
 * §6.4: "Passwords: argon2id (m=19456, t=2, p=1 — the OWASP baseline). Never
 * bcrypt-with-defaults, never SHA-anything."
 *
 * The parameters live in the PHC string that `hash` returns, so raising the cost
 * later does not need a migration: `needsRehash` spots the old parameters on the
 * next successful login and the caller re-hashes with the current ones.
 */
export const ARGON2_OPTIONS = {
  algorithm: ARGON2ID,
  memoryCost: 19_456, // KiB
  timeCost: 2,
  parallelism: 1,
} as const;

export const hashPassword = (plain: string): Promise<string> => hash(plain, ARGON2_OPTIONS);

/**
 * Returns false rather than throwing on a malformed stored hash. A corrupted
 * row must read as "wrong password", not as a 500 that tells the caller their
 * account exists and is broken.
 */
export const verifyPassword = async (storedHash: string, plain: string): Promise<boolean> => {
  try {
    return await verify(storedHash, plain, ARGON2_OPTIONS);
  } catch {
    return false;
  }
};

/** True when `storedHash` was produced with weaker parameters than we now use. */
export const needsRehash = (storedHash: string): boolean => {
  const match = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$/.exec(storedHash);
  if (match === null) return true; // not argon2id at all — definitely rehash

  const [, m, t, p] = match;
  return (
    Number(m) < ARGON2_OPTIONS.memoryCost ||
    Number(t) < ARGON2_OPTIONS.timeCost ||
    Number(p) !== ARGON2_OPTIONS.parallelism
  );
};
