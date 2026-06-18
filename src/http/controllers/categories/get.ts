import type { FastifyReply, FastifyRequest } from "fastify";
import { makeGetCategoryUseCase } from "@/use-cases/factories/make-category-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type { CategoryIdParam } from "./schemas";

export async function get(
  request: FastifyRequest<{ Params: CategoryIdParam }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  try {
    const { category } = await makeGetCategoryUseCase().execute({ id });
    return reply.status(200).send({ data: category });
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
