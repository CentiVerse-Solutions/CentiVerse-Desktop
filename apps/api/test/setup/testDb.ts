/**
 * The API test suite runs against a real Postgres, not a mock.
 *
 * §6.2's most important rules — the deferrable constraint trigger, the
 * functional unique index, the partial indexes — exist only in the database. A
 * suite that stubs Prisma would pass while every one of them was broken, which
 * is precisely the failure mode worth guarding against here.
 */

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://centiverse:centiverse@localhost:5432/centiverse_test?schema=public';

/** The maintenance database, used only to CREATE DATABASE for the test one. */
export const adminUrlFor = (url: string): { adminUrl: string; database: string } => {
  const parsed = new URL(url);
  const database = parsed.pathname.replace(/^\//, '');
  parsed.pathname = '/postgres';
  parsed.search = '';
  return { adminUrl: parsed.toString(), database };
};
