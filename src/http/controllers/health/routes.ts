import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

export async function healthRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        response: {
          200: z.object({ status: z.string(), timestamp: z.string() }),
        },
      },
    },
    async () => {
      return { status: "ok", timestamp: new Date().toISOString() };
    },
  );
}
