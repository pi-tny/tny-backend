import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  dataResponse,
  errorResponseSchema,
  validationErrorResponseSchema,
} from "@/http/http-schemas";
import {
  categoryListResponseSchema,
  categorySchema,
  listCategoriesQuerySchema,
} from "@/http/controllers/categories/schemas";
import { verifyJwt } from "@/http/middlewares/verify-jwt";
import { bearerSecurity } from "@/http/openapi";
import { list } from "./list";
import { create } from "./create";
import { update } from "./update";
import { remove } from "./delete";
import { categoryBodySchema, categoryIdParamSchema } from "./schemas";

const tags = ["Admin — Categories"];

export async function adminCategoriesRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.addHook("onRequest", verifyJwt);

  router.get(
    "/admin/categories",
    {
      schema: {
        tags,
        summary: "Listar categorias",
        security: bearerSecurity,
        querystring: listCategoriesQuerySchema,
        response: {
          200: categoryListResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    list,
  );

  router.post(
    "/admin/categories",
    {
      schema: {
        tags,
        summary: "Criar categoria",
        security: bearerSecurity,
        body: categoryBodySchema,
        response: {
          201: dataResponse(categorySchema),
          400: validationErrorResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    create,
  );

  router.put(
    "/admin/categories/:id",
    {
      schema: {
        tags,
        summary: "Atualizar categoria",
        security: bearerSecurity,
        params: categoryIdParamSchema,
        body: categoryBodySchema,
        response: {
          200: dataResponse(categorySchema),
          400: validationErrorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    update,
  );

  router.delete(
    "/admin/categories/:id",
    {
      schema: {
        tags,
        summary: "Remover categoria",
        security: bearerSecurity,
        params: categoryIdParamSchema,
        response: {
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    remove,
  );
}
