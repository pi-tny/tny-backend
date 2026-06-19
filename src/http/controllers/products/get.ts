import type { FastifyReply, FastifyRequest } from "fastify";
import { makeGetProductUseCase } from "@/use-cases/factories/make-product-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type { ProductIdParam } from "./schemas";

export async function get(
  request: FastifyRequest<{ Params: ProductIdParam }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  try {
    const { product } = await makeGetProductUseCase().execute({ id });
    return reply.status(200).send({ data: product });
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
