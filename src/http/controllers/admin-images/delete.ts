import type { FastifyReply, FastifyRequest } from "fastify";
import { makeDeleteImageUseCase } from "@/use-cases/factories/make-image-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type { ImageIdParam } from "./schemas";

export async function remove(
  request: FastifyRequest<{ Params: ImageIdParam }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  try {
    await makeDeleteImageUseCase().execute({ id });
    return reply.status(204).send();
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
