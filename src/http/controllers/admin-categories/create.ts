import type { FastifyReply, FastifyRequest } from "fastify";
import { makeCreateCategoryUseCase } from "@/use-cases/factories/make-category-use-cases";
import type { CategoryBody } from "./schemas";

export async function create(
  request: FastifyRequest<{ Body: CategoryBody }>,
  reply: FastifyReply,
) {
  const { name, description } = request.body;

  const { category } = await makeCreateCategoryUseCase().execute({
    name,
    description: description ?? null,
  });

  return reply.status(201).send({ data: category });
}
