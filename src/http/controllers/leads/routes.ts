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
        summary: "Cadastrar lead para newsletter",
        description:
          "Cadastro opcional para receber promoções. Em email duplicado, " +
          "atualiza silenciosamente (upsert) e renova `consent_date`. " +
          "`marketing_consent` é registrado por boas práticas de LGPD.",
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
