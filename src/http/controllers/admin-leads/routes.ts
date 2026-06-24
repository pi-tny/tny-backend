import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { errorResponseSchema } from "@/http/http-schemas";
import { verifyJwt } from "@/http/middlewares/verify-jwt";
import { bearerSecurity } from "@/http/openapi";
import {
  leadIdParamSchema,
  leadSchema,
  listLeadsQuerySchema,
} from "@/http/controllers/leads/schemas";
import { paginationMetaSchema } from "@/http/controllers/products/schemas";
import { z } from "zod";
import { list } from "./list";
import { remove } from "./delete";

const tags = ["Admin — Leads"];

export async function adminLeadsRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.addHook("onRequest", verifyJwt);

  router.get(
    "/admin/leads",
    {
      schema: {
        tags,
        summary: "Listar leads",
        security: bearerSecurity,
        querystring: listLeadsQuerySchema,
        response: {
          200: z.object({
            data: z.array(leadSchema),
            meta: paginationMetaSchema,
          }),
          401: errorResponseSchema,
        },
      },
    },
    list,
  );

  router.delete(
    "/admin/leads/:id",
    {
      schema: {
        tags,
        summary: "Remover lead (direito de exclusão — LGPD)",
        security: bearerSecurity,
        params: leadIdParamSchema,
        response: {
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    remove,
  );
}
