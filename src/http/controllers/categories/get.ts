import type { FastifyReply, FastifyRequest } from "fastify";
import { makeGetCategoryUseCase } from "@/use-cases/factories/make-category-use-cases";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
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
    if (error instanceof ResourceNotFoundError) {
      return reply
        .status(404)
        .send({ error: { code: "NOT_FOUND", message: error.message } });
    }
    throw error;
  }
}
