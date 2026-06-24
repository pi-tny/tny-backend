import fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import cors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { env } from "@/env";
import { openapiConfig } from "@/http/openapi";
import { errorHandler } from "@/http/error-handler";
import { healthRoutes } from "@/http/controllers/health/routes";
import { adminAuthRoutes } from "@/http/controllers/admin-auth/routes";
import { categoriesRoutes } from "@/http/controllers/categories/routes";
import { adminCategoriesRoutes } from "@/http/controllers/admin-categories/routes";
import { productsRoutes } from "@/http/controllers/products/routes";
import { adminProductsRoutes } from "@/http/controllers/admin-products/routes";
import { adminVariantsRoutes } from "@/http/controllers/admin-variants/routes";
import { adminImagesRoutes } from "@/http/controllers/admin-images/routes";
import { ordersRoutes } from "@/http/controllers/orders/routes";
import { adminOrdersRoutes } from "@/http/controllers/admin-orders/routes";
import { leadsRoutes } from "@/http/controllers/leads/routes";
import { adminLeadsRoutes } from "@/http/controllers/admin-leads/routes";
import { adminAdminsRoutes } from "@/http/controllers/admin-admins/routes";

// Structured logging via Fastify's built-in pino. Silent under tests; JSON logs
// (with a request id per request) in dev/prod. The Authorization header is
// redacted so Bearer tokens never reach the logs.
const logger =
  env.NODE_ENV === "test"
    ? false
    : {
        level: env.NODE_ENV === "production" ? "info" : "debug",
        redact: ["req.headers.authorization"],
      };

export const app = fastify({ logger }).withTypeProvider<ZodTypeProvider>();

// Zod drives request validation and response serialization.
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// CORS: "*" allows any origin; otherwise a comma-separated allowlist.
app.register(cors, {
  origin:
    env.CORS_ORIGIN === "*"
      ? true
      : env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
});

// Swagger: the OpenAPI spec is generated from the routes' Zod schemas via
// `jsonSchemaTransform`; global metadata (info/servers/tags/securitySchemes)
// comes from @/http/openapi. UI at /docs, spec JSON at /docs/json.
app.register(fastifySwagger, {
  openapi: openapiConfig,
  transform: jsonSchemaTransform,
});
app.register(fastifySwaggerUi, { routePrefix: "/docs" });

// Auth is Bearer-only (Authorization header); no refresh cookie.
app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  sign: { expiresIn: "1d" },
});

app.setErrorHandler(errorHandler);

// Unmatched routes follow the same Error shape as everything else.
app.setNotFoundHandler((_request, reply) => {
  return reply.status(404).send({
    error: { code: "NOT_FOUND", message: "Resource not found" },
  });
});

// Routes (registered manually, no autoload — SKILL-1).
app.register(healthRoutes);
app.register(adminAuthRoutes);
app.register(categoriesRoutes);
app.register(adminCategoriesRoutes);
app.register(productsRoutes);
app.register(adminProductsRoutes);
app.register(adminVariantsRoutes);
app.register(adminImagesRoutes);
app.register(ordersRoutes);
app.register(adminOrdersRoutes);
app.register(leadsRoutes);
app.register(adminLeadsRoutes);
app.register(adminAdminsRoutes);
