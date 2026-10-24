import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
});

/** True when the configured database is PostgreSQL (affects case-insensitive search). */
export const isPostgres = (process.env.DATABASE_URL || '').startsWith('postgres');

/** Prisma `contains` filter that is case-insensitive on both SQLite (LIKE) and PostgreSQL (mode). */
export function containsInsensitive(value: string) {
  return isPostgres ? { contains: value, mode: 'insensitive' as const } : { contains: value };
}
