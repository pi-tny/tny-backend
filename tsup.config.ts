import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  outDir: "dist",
  format: ["cjs"],
  target: "node22",
  clean: true,
  external: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
});
