import type { FastifyReply, FastifyRequest } from "fastify";

// Auth is Bearer-only/stateless: there is no server-side session to destroy, so
// logout simply acknowledges. The client discards its token.
export async function logout(_request: FastifyRequest, reply: FastifyReply) {
  return reply.status(204).send();
}
