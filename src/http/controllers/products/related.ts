import type { FastifyReply, FastifyRequest } from "fastify";
import { makeGetRelatedProductsUseCase } from "@/use-cases/factories/make-product-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type { ProductIdParam, RelatedQuery } from "./schemas";

export async function related(
  request: FastifyRequest<{ Params: ProductIdParam; Querystring: RelatedQuery }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const { limit } = request.query;

  try {
    const { products } = await makeGetRelatedProductsUseCase().execute({
      id,
      limit,
    });
    return reply.status(200).send({ data: products });
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
