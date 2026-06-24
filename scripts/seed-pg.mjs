// Seeds the Postgres DB from the host in one shot.
//
// The generated Prisma client embeds the active provider, so a host that keeps
// the sqlite client (the committed default, used by `npm test`) can't seed
// Postgres directly. This script generates the postgres client, applies the
// postgres migrations, seeds, then restores the sqlite client — leaving the repo
// back in its test-ready default state.
//
// Uses DATABASE_URL from the environment / .env, which must point at Postgres
// (e.g. postgresql://tny:tny@localhost:5433/tny for the dockerized DB).
import { execSync } from "node:child_process";

const run = (args, provider) =>
  execSync(`node scripts/prisma.mjs ${args}`, {
    stdio: "inherit",
    env: { ...process.env, DATABASE_PROVIDER: provider },
  });

try {
  console.log("→ gerando client postgres…");
  run("generate", "postgres");
  console.log("→ aplicando migrations no postgres…");
  run("migrate deploy", "postgres");
  console.log("→ semeando o postgres…");
  run("db seed", "postgres");
} finally {
  // Always restore the sqlite client so `npm test` / dev stay on the default.
  console.log("→ restaurando o client sqlite (default de testes/dev)…");
  run("generate", "sqlite");
}
