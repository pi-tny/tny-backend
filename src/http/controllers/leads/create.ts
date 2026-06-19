import type { FastifyReply, FastifyRequest } from "fastify";
import { makeCreateLeadUseCase } from "@/use-cases/factories/make-lead-use-cases";
import type { LeadCreateBody } from "./schemas";

export async function create(
  request: FastifyRequest<{ Body: LeadCreateBody }>,
  reply: FastifyReply,
) {
  const { lead } = await makeCreateLeadUseCase().execute(request.body);
  return reply.status(201).send({ data: lead });
}
