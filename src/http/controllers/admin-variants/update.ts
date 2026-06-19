import type { FastifyReply, FastifyRequest } from "fastify";
import { makeUpdateVariantUseCase } from "@/use-cases/factories/make-variant-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type { VariantIdParam, VariantUpdateBody } from "./schemas";

export async function update(
  request: FastifyRequest<{ Params: VariantIdParam; Body: VariantUpdateBody }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  try {
    const { variant } = await makeUpdateVariantUseCase().execute({
      id,
      ...request.body,
    });
    return reply.status(200).send({ data: variant });
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
