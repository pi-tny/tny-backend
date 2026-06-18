import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

const TEST_DATABASE_URL = "file:./prisma/test.db";

// Creates an isolated SQLite database for integration tests by applying the
// existing migrations, then removes the file on teardown.
export default function setup() {
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });

  return () => {
    rmSync("prisma/test.db", { force: true });
    rmSync("prisma/test.db-journal", { force: true });
  };
}
