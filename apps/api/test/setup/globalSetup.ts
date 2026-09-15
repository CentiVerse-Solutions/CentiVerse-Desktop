import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { TEST_DATABASE_URL, adminUrlFor } from './testDb';

/**
 * Creates the test database if it does not exist, then brings it to the latest
 * migration. Runs once for the whole suite.
 */
export default async function globalSetup(): Promise<void> {
  const { adminUrl, database } = adminUrlFor(TEST_DATABASE_URL);

  const admin = new PrismaClient({ datasources: { db: { url: adminUrl } } });
  try {
    const existing = await admin.$queryRawUnsafe<{ datname: string }[]>(
      'SELECT datname FROM pg_database WHERE datname = $1',
      database,
    );
    if (existing.length === 0) {
      // CREATE DATABASE cannot run inside a transaction, which is why this is
      // $executeRawUnsafe on its own rather than part of a batch.
      await admin.$executeRawUnsafe(`CREATE DATABASE "${database}"`);
    }
  } catch (error) {
    throw new Error(
      `Cannot reach Postgres at ${adminUrl}.\n` +
        'The API suite needs a real database: run `pnpm db:up` from the repository root.\n' +
        `Original error: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    await admin.$disconnect();
  }

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'pipe',
  });
}
