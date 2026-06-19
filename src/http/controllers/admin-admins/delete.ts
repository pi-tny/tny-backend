import type { FastifyReply, FastifyRequest } from "fastify";
import { makeDeleteAdminUseCase } from "@/use-cases/factories/make-admin-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type { AdminIdParam } from "./schemas";

export async function remove(
  request: FastifyRequest<{ Params: AdminIdParam }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  try {
    await makeDeleteAdminUseCase().execute({ id });
    return reply.status(204).send();
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
