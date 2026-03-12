import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma";

type GlobalPrismaState = {
  prisma?: PrismaClient;
  prismaClientCtor?: typeof PrismaClient;
};

const globalForPrisma = globalThis as unknown as GlobalPrismaState;

if (process.env.PRISMA_CLIENT_ENGINE_TYPE === "client") {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const cachedPrismaClient =
  globalForPrisma.prismaClientCtor === PrismaClient
    ? globalForPrisma.prisma
    : undefined;

if (
  process.env.NODE_ENV !== "production" &&
  globalForPrisma.prisma &&
  globalForPrisma.prismaClientCtor !== PrismaClient
) {
  void globalForPrisma.prisma.$disconnect().catch(() => {});
}

export const prisma =
  cachedPrismaClient ??
  new PrismaClient({
    log: ["error", "warn"],
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaClientCtor = PrismaClient;
}
