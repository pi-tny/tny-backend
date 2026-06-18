import type { FastifyReply, FastifyRequest } from "fastify";
import { makeUpdateCategoryUseCase } from "@/use-cases/factories/make-category-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type { CategoryBody, CategoryIdParam } from "./schemas";

export async function update(
  request: FastifyRequest<{ Params: CategoryIdParam; Body: CategoryBody }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const { name, description } = request.body;

  try {
    const { category } = await makeUpdateCategoryUseCase().execute({
      id,
      name,
      description: description ?? null,
    });
    return reply.status(200).send({ data: category });
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
