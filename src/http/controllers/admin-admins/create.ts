import type { FastifyReply, FastifyRequest } from "fastify";
import { makeCreateAdminUseCase } from "@/use-cases/factories/make-admin-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type { AdminCreateBody } from "./schemas";

export async function create(
  request: FastifyRequest<{ Body: AdminCreateBody }>,
  reply: FastifyReply,
) {
  try {
    const { admin } = await makeCreateAdminUseCase().execute(request.body);
    return reply.status(201).send({ data: admin });
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
