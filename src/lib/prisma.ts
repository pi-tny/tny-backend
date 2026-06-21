import { env } from "@/env";
import { PrismaClient } from "../../generated/prisma";

// driver adapter picked by env: sqlite (dev) or postgres (prod).
// Loaded lazily so a Postgres deploy (e.g. Vercel) never touches the native
// better-sqlite3 binding, and a sqlite dev run never needs pg.
function createAdapter() {
  if (env.DATABASE_PROVIDER === "postgres") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require("@prisma/adapter-pg");
    return new PrismaPg({ connectionString: env.DATABASE_URL });
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
  return new PrismaBetterSqlite3({ url: env.DATABASE_URL });
}

export const prisma = new PrismaClient({
  adapter: createAdapter(),
  log: env.NODE_ENV === "dev" ? ["query"] : [],
});
