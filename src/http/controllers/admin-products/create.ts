import type { FastifyReply, FastifyRequest } from "fastify";
import { makeCreateProductUseCase } from "@/use-cases/factories/make-product-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type { ProductCreateBody } from "./schemas";

export async function create(
  request: FastifyRequest<{ Body: ProductCreateBody }>,
  reply: FastifyReply,
) {
  try {
    const { product } = await makeCreateProductUseCase().execute(request.body);
    return reply.status(201).send({ data: product });
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
