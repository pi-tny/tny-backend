import { env } from "@/env";

// Case-insensitive `contains` filter that stays portable across providers.
// Postgres needs `mode: "insensitive"` explicitly; SQLite's LIKE is already
// case-insensitive for ASCII, so the plain filter is enough there.
export function insensitiveContains(value: string) {
  return env.DATABASE_PROVIDER === "postgres"
    ? { contains: value, mode: "insensitive" as const }
    : { contains: value };
}
