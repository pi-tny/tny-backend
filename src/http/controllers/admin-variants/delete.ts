import type { FastifyReply, FastifyRequest } from "fastify";
import { makeDeleteVariantUseCase } from "@/use-cases/factories/make-variant-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type { VariantIdParam } from "./schemas";

export async function remove(
  request: FastifyRequest<{ Params: VariantIdParam }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  try {
    await makeDeleteVariantUseCase().execute({ id });
    return reply.status(204).send();
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
