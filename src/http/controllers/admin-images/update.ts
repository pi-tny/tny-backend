import type { FastifyReply, FastifyRequest } from "fastify";
import { makeUpdateImageUseCase } from "@/use-cases/factories/make-image-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type { ImageIdParam, ImageUpdateBody } from "./schemas";

export async function update(
  request: FastifyRequest<{ Params: ImageIdParam; Body: ImageUpdateBody }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  try {
    const { image } = await makeUpdateImageUseCase().execute({
      id,
      ...request.body,
    });
    return reply.status(200).send({ data: image });
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
