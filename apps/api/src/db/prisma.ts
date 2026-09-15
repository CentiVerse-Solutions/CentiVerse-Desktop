import { PrismaClient } from '@prisma/client';

/**
 * One client per process. Prisma manages the connection pool itself, so a
 * second instance means a second pool — which in dev, under HMR, is how you
 * exhaust Postgres' connection limit without writing a single extra query.
 */
export type Db = PrismaClient;

let client: PrismaClient | undefined;

export const getDb = (databaseUrl?: string): Db => {
  // Two explicit calls rather than one with a conditional argument: Prisma's
  // options type is a generic `Subset`, which does not accept a union.
  client ??=
    databaseUrl === undefined
      ? new PrismaClient()
      : new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  return client;
};

export const disconnectDb = async (): Promise<void> => {
  await client?.$disconnect();
  client = undefined;
};
