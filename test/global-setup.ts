import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

const TEST_DATABASE_URL = "file:./prisma/test.db";

// Creates an isolated SQLite database for integration tests by applying the
// existing migrations, then removes the file on teardown.
// Goes through scripts/prisma.mjs with DATABASE_PROVIDER=sqlite so the run stays
// hermetic: it syncs the schema datasource to sqlite first (db:studio/dev may have
// left it on postgresql) and uses the sqlite migrations — `npm test` just works
// regardless of what the local .env / schema were last set to.
export default function setup() {
  execSync("node scripts/prisma.mjs migrate deploy", {
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
      DATABASE_PROVIDER: "sqlite",
    },
    stdio: "inherit",
  });

  return () => {
    rmSync("prisma/test.db", { force: true });
    rmSync("prisma/test.db-journal", { force: true });
  };
}
