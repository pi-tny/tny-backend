import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "@/env";
import { makeCreateOrderUseCase } from "@/use-cases/factories/make-order-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import { buildWhatsappLink } from "@/utils/whatsapp";
import type { OrderCreateBody } from "./schemas";

export async function create(
  request: FastifyRequest<{ Body: OrderCreateBody }>,
  reply: FastifyReply,
) {
  try {
    const { order } = await makeCreateOrderUseCase().execute(request.body);
    const { whatsapp_url, whatsapp_message } = buildWhatsappLink(
      order,
      env.WHATSAPP_NUMBER,
    );

    return reply.status(201).send({
      data: {
        id: order.id,
        total: order.total,
        status: order.status,
        created_at: order.created_at,
        whatsapp_url,
        whatsapp_message,
      },
    });
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
