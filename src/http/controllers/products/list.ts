import type { FastifyReply, FastifyRequest } from "fastify";
import { makeListProductsUseCase } from "@/use-cases/factories/make-product-use-cases";
import { buildPaginationMeta, type ListProductsQuery } from "./schemas";

export async function list(
  request: FastifyRequest<{ Querystring: ListProductsQuery }>,
  reply: FastifyReply,
) {
  const { category_id, q, page, limit } = request.query;

  const { result } = await makeListProductsUseCase().execute({
    categoryId: category_id,
    q,
    active: true,
    page,
    limit,
  });

  return reply.status(200).send({
    data: result.items,
    meta: buildPaginationMeta(result.total, result.page, result.limit),
  });
}
