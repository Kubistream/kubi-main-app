import { PrismaClient } from "@prisma/client";

import { isProduction } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

console.log("🔄 Initializing Prisma Client...");

export const prisma = globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}
