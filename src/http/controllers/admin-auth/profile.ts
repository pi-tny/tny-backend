import type { FastifyReply, FastifyRequest } from "fastify";
import { makeGetAdminProfileUseCase } from "@/use-cases/factories/make-auth-use-cases";
import { mapDomainError } from "@/http/map-domain-error";

export async function profile(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { admin } = await makeGetAdminProfileUseCase().execute({
      adminId: request.user.sub,
    });

    return reply.status(200).send({
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        active: admin.active,
        created_at: admin.created_at,
      },
    });
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
