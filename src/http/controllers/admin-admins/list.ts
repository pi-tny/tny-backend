import type { FastifyReply, FastifyRequest } from "fastify";
import { makeListAdminsUseCase } from "@/use-cases/factories/make-admin-use-cases";

export async function list(_request: FastifyRequest, reply: FastifyReply) {
  const { admins } = await makeListAdminsUseCase().execute();
  // password_hash is stripped by the response schema (adminSchema).
  return reply.status(200).send({ data: admins });
}
