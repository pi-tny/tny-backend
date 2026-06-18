import type { FastifyReply, FastifyRequest } from "fastify";

// Responds 401 directly when the Bearer token is missing or invalid.
export async function verifyJwt(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({
      error: { code: "UNAUTHORIZED", message: "Unauthorized" },
    });
  }
}
