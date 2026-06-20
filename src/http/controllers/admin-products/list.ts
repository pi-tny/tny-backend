import type { FastifyReply, FastifyRequest } from "fastify";
import { makeListProductsUseCase } from "@/use-cases/factories/make-product-use-cases";
import { buildPaginationMeta } from "@/http/controllers/products/schemas";
import type { AdminListProductsQuery } from "./schemas";

export async function list(
  request: FastifyRequest<{ Querystring: AdminListProductsQuery }>,
  reply: FastifyReply,
) {
  const {
    active,
    category_id,
    q,
    min_price,
    max_price,
    on_sale,
    in_stock,
    sort,
    page,
    limit,
  } = request.query;

  const { result } = await makeListProductsUseCase().execute({
    active,
    categoryId: category_id,
    q,
    minPrice: min_price,
    maxPrice: max_price,
    onSale: on_sale,
    inStock: in_stock,
    sort,
    page,
    limit,
  });

  return reply.status(200).send({
    data: result.items,
    meta: buildPaginationMeta(result.total, result.page, result.limit),
  });
}
