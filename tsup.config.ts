import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    server: "src/server.ts",
    app: "src/app.ts",
  },
  outDir: "dist",
  format: ["cjs"],
  target: "node22",
  clean: true,
  external: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  outExtension({ format }) {
    return { js: ".js" }; // ambos saem como .js
  },
});
