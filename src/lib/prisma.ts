import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { env } from "@/env";
import { PrismaClient } from "../../generated/prisma";

// Prisma 7 requires a driver adapter; the datasource URL is supplied to it
// (not to the schema). SQLite here in dev; swap the adapter for Postgres later.
const adapter = new PrismaBetterSqlite3({ url: env.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === "dev" ? ["query"] : [],
});
