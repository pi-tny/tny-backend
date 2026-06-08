import { env } from "@/env";
import { PrismaClient } from "@prisma/client/extension";

export const prisma = new PrismaClient({
  log: env.NODE_ENV === "dev" ? ["query"] : [],
});
