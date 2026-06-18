import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from "fastify-type-provider-zod";
import { env } from "@/env";

type FastifyErrorHandler = Parameters<FastifyInstance["setErrorHandler"]>[0];

/**
 * Global error handler. Emits the `Error` / `ValidationError` shapes defined in
 * docs/openapi.yaml:
 *   - Error:           { error: { code, message } }
 *   - ValidationError: { error: { code, message, fields: [{ field, message }] } }
 *
 * Domain errors are mapped to HTTP status in each controller (SKILL-1). This
 * handler covers request validation and anything unexpected (safety net).
 */
export const errorHandler: FastifyErrorHandler = (error, _request, reply) => {
  // Request validation failed (Zod schema on the route).
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(400).send({
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation error",
        fields: error.validation.map((entry) => ({
          // instancePath looks like "/name" or "/items/0/quantity".
          field: entry.instancePath.replace(/^\//, "").replace(/\//g, "."),
          message: entry.message,
        })),
      },
    });
  }

  // Response serialization failed (schema mismatch) — programming error.
  if (isResponseSerializationError(error)) {
    return reply.status(500).send({
      error: {
        code: "RESPONSE_SERIALIZATION_ERROR",
        message: "Response does not match the expected schema",
      },
    });
  }

  // A bare ZodError thrown somewhere outside the route schema.
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation error",
        fields: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
  }

  if (env.NODE_ENV !== "production") {
    console.error(error);
  } else {
    // TODO: report to an external tool (Datadog/NewRelic/Sentry).
  }

  return reply.status(500).send({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    },
  });
};
