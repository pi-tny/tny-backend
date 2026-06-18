import type { FastifyReply, FastifyRequest } from "fastify";
import { makeUpdateCategoryUseCase } from "@/use-cases/factories/make-category-use-cases";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
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
    if (error instanceof ResourceNotFoundError) {
      return reply
        .status(404)
        .send({ error: { code: "NOT_FOUND", message: error.message } });
    }
    throw error;
  }
}
