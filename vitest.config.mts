import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.spec.ts"],
    globalSetup: ["./test/global-setup.ts"],
    // Integration tests share one SQLite file; run test files sequentially so
    // resetDatabase() in one file can't wipe another's data mid-test.
    fileParallelism: false,
    // Integration tests run against an isolated SQLite file (see test/global-setup.ts).
    // Unit tests ignore the DB. dotenv won't override vars already set here.
    env: {
      DATABASE_URL: "file:./prisma/test.db",
      NODE_ENV: "test",
      JWT_SECRET: "test-secret",
      CORS_ORIGIN: "*",
    },
    coverage: {
      provider: "v8",
      include: ["src/use-cases/**"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
