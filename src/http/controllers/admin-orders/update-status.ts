import type { FastifyReply, FastifyRequest } from "fastify";
import { makeUpdateOrderStatusUseCase } from "@/use-cases/factories/make-order-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type {
  OrderIdParam,
  UpdateOrderStatusBody,
} from "@/http/controllers/orders/schemas";

export async function updateStatus(
  request: FastifyRequest<{
    Params: OrderIdParam;
    Body: UpdateOrderStatusBody;
  }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const { status } = request.body;

  try {
    const { order } = await makeUpdateOrderStatusUseCase().execute({
      id,
      status,
    });
    return reply.status(200).send({ data: order });
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
