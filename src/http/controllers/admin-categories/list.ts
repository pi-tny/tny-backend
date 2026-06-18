import type { FastifyReply, FastifyRequest } from "fastify";
import { makeListCategoriesUseCase } from "@/use-cases/factories/make-category-use-cases";

// Same data as the public listing; the difference is the auth hook on the route.
export async function list(_request: FastifyRequest, reply: FastifyReply) {
  const { categories } = await makeListCategoriesUseCase().execute();

  return reply.status(200).send({ data: categories });
}
