import type { FastifyReply, FastifyRequest } from "fastify";
import { makeDeleteCategoryUseCase } from "@/use-cases/factories/make-category-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type { CategoryIdParam } from "./schemas";

export async function remove(
  request: FastifyRequest<{ Params: CategoryIdParam }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  try {
    await makeDeleteCategoryUseCase().execute({ id });
    return reply.status(204).send();
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
