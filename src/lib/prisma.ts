import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/env";
import { PrismaClient } from "../../generated/prisma";

// driver adapter picked by env: sqlite (dev) or postgres (prod).
const adapter =
  env.DATABASE_PROVIDER === "postgres"
    ? new PrismaPg({ connectionString: env.DATABASE_URL })
    : new PrismaBetterSqlite3({ url: env.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === "dev" ? ["query"] : [],
});
