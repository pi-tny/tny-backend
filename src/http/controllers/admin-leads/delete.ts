import type { FastifyReply, FastifyRequest } from "fastify";
import { makeDeleteLeadUseCase } from "@/use-cases/factories/make-lead-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type { LeadIdParam } from "@/http/controllers/leads/schemas";

export async function remove(
  request: FastifyRequest<{ Params: LeadIdParam }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  try {
    await makeDeleteLeadUseCase().execute({ id });
    return reply.status(204).send();
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
