import type { FastifyReply, FastifyRequest } from "fastify";
import { makeUpdateProductUseCase } from "@/use-cases/factories/make-product-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type { ProductIdParam } from "@/http/controllers/products/schemas";
import type { ProductUpdateBody } from "./schemas";

export async function update(
  request: FastifyRequest<{ Params: ProductIdParam; Body: ProductUpdateBody }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  try {
    const { product } = await makeUpdateProductUseCase().execute({
      id,
      ...request.body,
    });
    return reply.status(200).send({ data: product });
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
