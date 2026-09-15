import { z } from 'zod';

/**
 * Environment is validated once, at boot, and never read via `process.env`
 * anywhere else. A missing or malformed variable fails the process immediately
 * with a readable message rather than surfacing as a null three layers down.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().url(),
  /**
   * Signs the 15-minute access tokens (§6.4). 32 characters is the floor
   * because a short secret makes the signature forgeable offline, which defeats
   * the point of not doing a database lookup per request.
   */
  JWT_SECRET: z.string().min(32, 'must be at least 32 characters'),
  /**
   * Where the refresh cookie is scoped. Left unset for localhost, where a
   * Domain attribute would stop the cookie being set at all.
   */
  COOKIE_DOMAIN: z.string().optional(),
  /** Comma-separated list of origins allowed to send credentialed requests. */
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((s) => s.split(',').map((o) => o.trim()).filter(Boolean)),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export type Env = z.infer<typeof EnvSchema>;

export const loadEnv = (source: NodeJS.ProcessEnv = process.env): Env => {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment:\n${detail}`);
  }
  return parsed.data;
};
