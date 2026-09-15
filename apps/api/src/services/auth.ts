import { uuidv7 } from 'uuidv7';
import type { Prisma, Session, User } from '@prisma/client';
import type {
  AccessTokenClaims,
  LoginInput,
  RegisterInput,
  SessionDto,
  UserDto,
} from '@centiverse/contracts';
import type { Db } from '../db/prisma';
import { ApiError } from '../lib/problem';
import { hashPassword, needsRehash, verifyPassword } from '../lib/password';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  expiryFromNow,
  generateRefreshToken,
  hashRefreshToken,
} from '../lib/tokens';

/**
 * §6.4, implemented. The interesting part is `refresh`.
 *
 * Refresh tokens rotate on every use: presenting one revokes it and mints a
 * replacement in the same family. The revoked row is kept, hash and all, which
 * is what makes theft detectable — a token that has already been rotated away
 * can only be presented by someone who copied it, so presenting one revokes
 * every session in the family and forces a re-login.
 */

export interface AuthDeps {
  db: Db;
  /** Injected so the service stays free of Fastify and is testable directly. */
  signAccessToken: (claims: AccessTokenClaims) => Promise<string>;
  now?: () => Date;
}

export interface RequestContext {
  userAgent?: string | undefined;
  ip?: string | undefined;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const toUserDto = (user: User): UserDto => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  avatarUrl: user.avatarUrl,
  // CHAR(3) comes back space-padded if anything ever writes a shorter value.
  defaultCurrency: user.defaultCurrency.trim() as UserDto['defaultCurrency'],
  locale: user.locale,
  timezone: user.timezone,
  createdAt: user.createdAt.toISOString(),
  claimedAt: user.claimedAt?.toISOString() ?? null,
});

const toSessionDto = (session: Session, currentSessionId: string): SessionDto => ({
  id: session.id,
  userAgent: session.userAgent,
  ip: session.ip,
  createdAt: session.createdAt.toISOString(),
  lastUsedAt: session.lastUsedAt.toISOString(),
  expiresAt: session.expiresAt.toISOString(),
  current: session.id === currentSessionId,
});

/** Mints a session row and the token pair that belongs to it. */
const issueSession = async (
  deps: AuthDeps,
  tx: Prisma.TransactionClient,
  userId: string,
  familyId: string,
  context: RequestContext,
): Promise<{ tokens: IssuedTokens; sessionId: string }> => {
  const now = deps.now?.() ?? new Date();
  const sessionId = uuidv7();
  const refreshToken = generateRefreshToken();

  await tx.session.create({
    data: {
      id: sessionId,
      userId,
      familyId,
      refreshTokenHash: hashRefreshToken(refreshToken),
      userAgent: context.userAgent ?? null,
      ip: context.ip ?? null,
      createdAt: now,
      lastUsedAt: now,
      expiresAt: expiryFromNow(REFRESH_TOKEN_TTL_SECONDS, now),
    },
  });

  const accessToken = await deps.signAccessToken({ sub: userId, sid: sessionId });
  return {
    tokens: { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS },
    sessionId,
  };
};

export const register = async (
  deps: AuthDeps,
  input: RegisterInput,
  context: RequestContext,
): Promise<{ user: UserDto; tokens: IssuedTokens }> => {
  const passwordHash = await hashPassword(input.password);
  const userId = uuidv7();

  try {
    return await deps.db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: userId,
          email: input.email,
          displayName: input.displayName,
          credentials: { create: { passwordHash } },
          notificationPrefs: { create: { prefs: {} } },
        },
      });

      const { tokens } = await issueSession(deps, tx, user.id, uuidv7(), context);
      return { user: toUserDto(user), tokens };
    });
  } catch (error) {
    // The partial unique index on live emails is what rejects a duplicate.
    if (isUniqueViolation(error)) {
      throw ApiError.conflict('an account with that email already exists');
    }
    throw error;
  }
};

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: unknown }).code === 'P2002';

/**
 * A pre-computed argon2id hash of a value nobody knows, verified against when
 * the email does not exist. Without it, "no such user" returns in a fraction of
 * a millisecond while a real account takes tens of milliseconds, and the
 * difference enumerates the user table.
 */
let decoyHash: string | undefined;
const getDecoyHash = async (): Promise<string> => {
  decoyHash ??= await hashPassword(generateRefreshToken());
  return decoyHash;
};

export const login = async (
  deps: AuthDeps,
  input: LoginInput,
  context: RequestContext,
): Promise<{ user: UserDto; tokens: IssuedTokens }> => {
  const user = await deps.db.user.findFirst({
    where: { email: input.email, deletedAt: null },
    include: { credentials: true },
  });

  // Same message and comparable timing whether the email is unknown, the
  // account is a placeholder with no password, or the password is simply wrong.
  const storedHash = user?.credentials?.passwordHash ?? (await getDecoyHash());
  const ok = await verifyPassword(storedHash, input.password);

  if (!ok || user === null || user.credentials === null) {
    throw ApiError.unauthenticated('invalid email or password');
  }

  // §6.4: the cost parameters live in the hash, so raising them is applied
  // lazily on the next successful login rather than by a migration.
  if (needsRehash(user.credentials.passwordHash)) {
    const rehashed = await hashPassword(input.password);
    await deps.db.authCredential.update({
      where: { userId: user.id },
      data: { passwordHash: rehashed },
    });
  }

  const { tokens } = await deps.db.$transaction((tx) =>
    issueSession(deps, tx, user.id, uuidv7(), context),
  );
  return { user: toUserDto(user), tokens };
};

/**
 * Rotation with reuse detection.
 *
 * Three outcomes, and the middle one is the whole point:
 *   - the hash matches a live session  -> revoke it, mint its successor
 *   - the hash matches a revoked one   -> theft; revoke the entire family
 *   - the hash matches nothing         -> simply invalid
 */
export const refresh = async (
  deps: AuthDeps,
  refreshToken: string,
  context: RequestContext,
): Promise<{ user: UserDto; tokens: IssuedTokens }> => {
  const now = deps.now?.() ?? new Date();
  const presentedHash = hashRefreshToken(refreshToken);

  const session = await deps.db.session.findUnique({
    where: { refreshTokenHash: presentedHash },
    include: { user: true },
  });

  if (session === null) {
    throw ApiError.unauthenticated('invalid refresh token');
  }

  if (session.revokedAt !== null) {
    // This token was rotated away already. The legitimate client moved on to
    // its successor, so whoever is holding this copy should not have it.
    await deps.db.session.updateMany({
      where: { familyId: session.familyId, revokedAt: null },
      data: { revokedAt: now },
    });
    throw ApiError.unauthenticated('refresh token reuse detected; all sessions revoked');
  }

  if (session.expiresAt <= now) {
    throw ApiError.unauthenticated('refresh token expired');
  }

  if (session.user.deletedAt !== null) {
    throw ApiError.unauthenticated('account is no longer active');
  }

  const { tokens } = await deps.db.$transaction(async (tx) => {
    // The old row is revoked rather than deleted: keeping its hash is what
    // makes the reuse branch above possible.
    await tx.session.update({
      where: { id: session.id },
      data: { revokedAt: now, lastUsedAt: now },
    });
    return issueSession(deps, tx, session.userId, session.familyId, context);
  });

  return { user: toUserDto(session.user), tokens };
};

/** Ends one session family. Idempotent: an unknown token is not an error. */
export const logout = async (deps: AuthDeps, refreshToken: string | undefined): Promise<void> => {
  if (refreshToken === undefined) return;
  const now = deps.now?.() ?? new Date();

  const session = await deps.db.session.findUnique({
    where: { refreshTokenHash: hashRefreshToken(refreshToken) },
  });
  if (session === null) return;

  await deps.db.session.updateMany({
    where: { familyId: session.familyId, revokedAt: null },
    data: { revokedAt: now },
  });
};

/**
 * One row per active login, not one per rotation: the revoked predecessors are
 * an implementation detail of theft detection and would make the Security
 * screen unreadable.
 */
export const listSessions = async (
  deps: AuthDeps,
  userId: string,
  currentSessionId: string,
): Promise<SessionDto[]> => {
  const now = deps.now?.() ?? new Date();
  const sessions = await deps.db.session.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: now } },
    orderBy: { lastUsedAt: 'desc' },
  });
  return sessions.map((s) => toSessionDto(s, currentSessionId));
};

export const revokeSession = async (
  deps: AuthDeps,
  userId: string,
  sessionId: string,
): Promise<void> => {
  const now = deps.now?.() ?? new Date();
  const session = await deps.db.session.findFirst({ where: { id: sessionId, userId } });

  // Scoped to the caller's own sessions, so revoking someone else's reads as
  // "no such session" rather than confirming it exists (§6.5's reasoning).
  if (session === null) {
    throw ApiError.notFound('no such session');
  }

  await deps.db.session.updateMany({
    where: { familyId: session.familyId, revokedAt: null },
    data: { revokedAt: now },
  });
};
