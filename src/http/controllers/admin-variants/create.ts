import type { FastifyReply, FastifyRequest } from "fastify";
import { makeCreateVariantUseCase } from "@/use-cases/factories/make-variant-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type { ProductIdParam } from "@/http/controllers/products/schemas";
import type { VariantCreateBody } from "./schemas";

export async function create(
  request: FastifyRequest<{ Params: ProductIdParam; Body: VariantCreateBody }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  try {
    const { variant } = await makeCreateVariantUseCase().execute({
      productId: id,
      ...request.body,
    });
    return reply.status(201).send({ data: variant });
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
