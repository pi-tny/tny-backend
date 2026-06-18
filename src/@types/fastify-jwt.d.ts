import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    // JWT payload: `sub` is the authenticated admin id.
    // Auth is Bearer-only and there is a single role (admin), so no `role` claim.
    user: {
      sub: number;
    };
  }
}
