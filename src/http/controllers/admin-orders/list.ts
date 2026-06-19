import type { FastifyReply, FastifyRequest } from "fastify";
import { makeListOrdersUseCase } from "@/use-cases/factories/make-order-use-cases";
import type { ListOrdersQuery } from "@/http/controllers/orders/schemas";

export async function list(
  request: FastifyRequest<{ Querystring: ListOrdersQuery }>,
  reply: FastifyReply,
) {
  const { status } = request.query;

  const { orders } = await makeListOrdersUseCase().execute({ status });

  return reply.status(200).send({ data: orders });
}
