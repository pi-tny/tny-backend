// runs a prisma command after syncing the schema `provider` to DATABASE_PROVIDER.
// keeps a single schema file; provider is the only thing that differs per db.
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import "dotenv/config";

const provider = process.env.DATABASE_PROVIDER === "postgres" ? "postgresql" : "sqlite";
const schemaPath = "prisma/schema.prisma";

const schema = readFileSync(schemaPath, "utf8").replace(
  /provider = "(sqlite|postgresql)"/,
  `provider = "${provider}"`,
);
writeFileSync(schemaPath, schema);

execSync(`npx prisma ${process.argv.slice(2).join(" ")}`, { stdio: "inherit" });
