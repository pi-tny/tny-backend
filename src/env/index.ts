import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["dev", "test", "production"]).default("dev"),
  PORT: z.coerce.number().default(3000),
  DATABASE_PROVIDER: z.enum(["sqlite", "postgres"]).default("sqlite"),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  CORS_ORIGIN: z.string().default("*"),
  // Store WhatsApp number (digits only, e.g. 5585999999999) used to build the
  // wa.me link returned when an order is created. Empty = link without a number.
  WHATSAPP_NUMBER: z.string().default(""),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("Invalid environment variables", _env.error.issues);

  throw new Error("Invalid environment variables");
}

export const env = _env.data;
