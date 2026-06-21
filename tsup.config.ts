import { defineConfig } from "tsup";

const external = [
  "better-sqlite3",
  "@prisma/adapter-better-sqlite3",
];

export default defineConfig([
  {
    entry: ["src/server.ts"],
    outDir: "dist",
    format: ["cjs"],
    target: "node22",
    clean: true,
    external,
  },
  {
    entry: { app: "src/app" },
    outDir: "dist",
    format: ["cjs"],
    target: "node22",
    clean: false,
    external,
    outExtension: () => ({ js: ".cjs" }),
  },
]);
