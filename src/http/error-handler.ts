import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from "fastify-type-provider-zod";
import { env } from "@/env";

type FastifyErrorHandler = Parameters<FastifyInstance["setErrorHandler"]>[0];

export const errorHandler: FastifyErrorHandler = (error, _request, reply) => {
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(400).send({
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation error",
        fields: error.validation.map((entry) => ({
          field: entry.instancePath.replace(/^\//, "").replace(/\//g, "."),
          message: entry.message,
        })),
      },
    });
  }

  if (isResponseSerializationError(error)) {
    return reply.status(500).send({
      error: {
        code: "RESPONSE_SERIALIZATION_ERROR",
        message: "Response does not match the expected schema",
      },
    });
  }

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
