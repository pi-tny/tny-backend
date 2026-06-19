import type { FastifyReply, FastifyRequest } from "fastify";
import { makeListLeadsUseCase } from "@/use-cases/factories/make-lead-use-cases";
import { buildPaginationMeta } from "@/http/controllers/products/schemas";
import type { ListLeadsQuery } from "@/http/controllers/leads/schemas";

export async function list(
  request: FastifyRequest<{ Querystring: ListLeadsQuery }>,
  reply: FastifyReply,
) {
  const { q, page, limit } = request.query;

  const { result } = await makeListLeadsUseCase().execute({ q, page, limit });

  return reply.status(200).send({
    data: result.items,
    meta: buildPaginationMeta(result.total, result.page, result.limit),
  });
}
