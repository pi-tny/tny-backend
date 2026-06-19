import type { FastifyReply, FastifyRequest } from "fastify";
import { makeDeleteProductUseCase } from "@/use-cases/factories/make-product-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type { ProductIdParam } from "@/http/controllers/products/schemas";

export async function remove(
  request: FastifyRequest<{ Params: ProductIdParam }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  try {
    await makeDeleteProductUseCase().execute({ id });
    return reply.status(204).send();
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
