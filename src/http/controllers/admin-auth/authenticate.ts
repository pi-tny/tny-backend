import type { FastifyReply, FastifyRequest } from "fastify";
import { makeAuthenticateUseCase } from "@/use-cases/factories/make-auth-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type { LoginBody } from "./schemas";

export async function authenticate(
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply,
) {
  const { email, password } = request.body;

  try {
    const { admin } = await makeAuthenticateUseCase().execute({
      email,
      password,
    });

    const token = await reply.jwtSign({ sub: admin.id });

    return reply.status(200).send({ data: { token } });
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
