import type { FastifyReply, FastifyRequest } from "fastify";
import { makeGetOrderUseCase } from "@/use-cases/factories/make-order-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type { OrderIdParam } from "@/http/controllers/orders/schemas";

export async function get(
  request: FastifyRequest<{ Params: OrderIdParam }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  try {
    const { order } = await makeGetOrderUseCase().execute({ id });
    return reply.status(200).send({ data: order });
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
