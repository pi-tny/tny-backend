import type { FastifyReply, FastifyRequest } from "fastify";
import { makeAddProductImageUseCase } from "@/use-cases/factories/make-image-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type { ProductIdParam } from "@/http/controllers/products/schemas";
import type { ImageCreateBody } from "./schemas";

export async function create(
  request: FastifyRequest<{ Params: ProductIdParam; Body: ImageCreateBody }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  try {
    const { image } = await makeAddProductImageUseCase().execute({
      productId: id,
      ...request.body,
    });
    return reply.status(201).send({ data: image });
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
