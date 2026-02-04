import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client singleton for Next.js
 * Prevents multiple instances in development (hot reload)
 * and optimizes connection pooling in production
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
