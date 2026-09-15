import { z } from 'zod';
import { IsoDateTimeSchema, UuidSchema } from './common';
import { UserSchema } from './user';

/**
 * §6.4's wire shapes. The same schemas validate the request on the server and
 * the response on the client, so a drift between the two is a test failure
 * rather than a runtime surprise.
 */

/**
 * Deliberately permissive on composition and strict on length.
 *
 * Character-class rules ("one uppercase, one digit, one symbol") push people
 * toward `Password1!` and are worse than a length floor. NIST 800-63B says the
 * same. The cap exists only because argon2 will happily hash a megabyte and
 * that is a free denial of service.
 */
export const PasswordSchema = z
  .string()
  .min(10, 'use at least 10 characters')
  .max(256, 'password is too long');

export const EmailSchema = z.string().email().max(254).toLowerCase();

export const RegisterInputSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  displayName: z.string().min(1).max(100),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1).max(256),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

/**
 * The refresh token is absent from this shape on the web, where it travels as
 * an httpOnly cookie. Tauri cannot rely on cookies across its custom protocol
 * (§6.4), so the desktop client asks for it in the body and stores it in the OS
 * keychain. Both paths are supported from day one.
 */
export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  /** Seconds until `accessToken` expires — 900, per §6.4. */
  expiresIn: z.number().int().positive(),
  /** Present only when the client asked for the header/keychain path. */
  refreshToken: z.string().optional(),
});
export type AuthTokens = z.infer<typeof AuthTokensSchema>;

export const AuthResultSchema = z.object({
  user: UserSchema,
  tokens: AuthTokensSchema,
});
export type AuthResult = z.infer<typeof AuthResultSchema>;

export const RefreshInputSchema = z.object({
  /** Omitted by web clients, which send the cookie instead. */
  refreshToken: z.string().optional(),
});
export type RefreshInput = z.infer<typeof RefreshInputSchema>;

/** What the Account -> Security screen renders. Never includes a token. */
export const SessionSchema = z.object({
  id: UuidSchema,
  userAgent: z.string().nullable(),
  ip: z.string().nullable(),
  createdAt: IsoDateTimeSchema,
  lastUsedAt: IsoDateTimeSchema,
  expiresAt: IsoDateTimeSchema,
  /** True for the session making the request, so the UI can label it. */
  current: z.boolean(),
});
export type SessionDto = z.infer<typeof SessionSchema>;

/** The verified claims of an access token. */
export const AccessTokenClaimsSchema = z.object({
  sub: UuidSchema,
  sid: UuidSchema,
});
export type AccessTokenClaims = z.infer<typeof AccessTokenClaimsSchema>;

export const UpdateMeInputSchema = z
  .object({
    displayName: z.string().min(1).max(100),
    avatarUrl: z.string().url().nullable(),
    defaultCurrency: z.string().length(3),
    locale: z.string().min(2).max(20),
    timezone: z.string().min(1).max(64),
  })
  .partial();
export type UpdateMeInput = z.infer<typeof UpdateMeInputSchema>;
