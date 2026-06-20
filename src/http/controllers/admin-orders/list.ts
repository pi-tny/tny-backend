import type { FastifyReply, FastifyRequest } from "fastify";
import { makeListOrdersUseCase } from "@/use-cases/factories/make-order-use-cases";
import { buildPaginationMeta } from "@/http/controllers/products/schemas";
import type { ListOrdersQuery } from "@/http/controllers/orders/schemas";

export async function list(
  request: FastifyRequest<{ Querystring: ListOrdersQuery }>,
  reply: FastifyReply,
) {
  const { status, date_from, date_to, page, limit } = request.query;

  const { result } = await makeListOrdersUseCase().execute({
    status,
    dateFrom: date_from,
    dateTo: date_to,
    page,
    limit,
  });

  return reply.status(200).send({
    data: result.items,
    meta: buildPaginationMeta(result.total, result.page, result.limit),
  });
}
