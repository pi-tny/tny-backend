import type { FastifyReply, FastifyRequest } from "fastify";
import { makeUpdateAdminUseCase } from "@/use-cases/factories/make-admin-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type { AdminIdParam, AdminUpdateBody } from "./schemas";

export async function update(
  request: FastifyRequest<{ Params: AdminIdParam; Body: AdminUpdateBody }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  try {
    const { admin } = await makeUpdateAdminUseCase().execute({
      id,
      ...request.body,
    });
    return reply.status(200).send({ data: admin });
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
