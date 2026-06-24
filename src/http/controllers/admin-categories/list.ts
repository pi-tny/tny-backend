import type { FastifyReply, FastifyRequest } from "fastify";
import { makeListCategoriesUseCase } from "@/use-cases/factories/make-category-use-cases";
import { buildPaginationMeta } from "@/http/http-schemas";
import type { ListCategoriesQuery } from "@/http/controllers/categories/schemas";

// Same data as the public listing; the difference is the auth hook on the route.
export async function list(
  request: FastifyRequest<{ Querystring: ListCategoriesQuery }>,
  reply: FastifyReply,
) {
  const { page, limit } = request.query;

  const { result } = await makeListCategoriesUseCase().execute({ page, limit });

  return reply.status(200).send({
    data: result.items,
    meta: buildPaginationMeta(result.total, result.page, result.limit),
  });
}
