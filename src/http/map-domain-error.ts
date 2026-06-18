import type { FastifyReply } from "fastify";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

/**
 * Maps known domain errors to their HTTP response (openapi `Error` shape).
 * Unknown errors are re-thrown to the global error handler. Call from a
 * controller's catch block: `catch (error) { return mapDomainError(error, reply); }`.
 */
export function mapDomainError(error: unknown, reply: FastifyReply) {
  if (error instanceof ResourceNotFoundError) {
    return reply
      .status(404)
      .send({ error: { code: "NOT_FOUND", message: error.message } });
  }

  throw error;
}
