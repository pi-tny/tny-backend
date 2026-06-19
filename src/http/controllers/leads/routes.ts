import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { dataResponse, validationErrorResponseSchema } from "@/http/http-schemas";
import { create } from "./create";
import { leadCreateSchema, leadSchema } from "./schemas";

const tags = ["Leads (public)"];

export async function leadsRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.post(
    "/leads",
    {
      schema: {
        tags,
        body: leadCreateSchema,
        response: {
          201: dataResponse(leadSchema),
          400: validationErrorResponseSchema,
        },
      },
    },
    create,
  );
}
