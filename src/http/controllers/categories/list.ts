import type { FastifyReply, FastifyRequest } from "fastify";
import { makeListCategoriesUseCase } from "@/use-cases/factories/make-category-use-cases";

export async function list(_request: FastifyRequest, reply: FastifyReply) {
  const listCategories = makeListCategoriesUseCase();

  const { categories } = await listCategories.execute();

  return reply.status(200).send({ data: categories });
}
