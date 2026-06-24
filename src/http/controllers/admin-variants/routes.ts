import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  dataResponse,
  errorResponseSchema,
  validationErrorResponseSchema,
} from "@/http/http-schemas";
import { verifyJwt } from "@/http/middlewares/verify-jwt";
import { bearerSecurity } from "@/http/openapi";
import {
  productIdParamSchema,
  variantViewSchema,
} from "@/http/controllers/products/schemas";
import { list } from "./list";
import { create } from "./create";
import { update } from "./update";
import { remove } from "./delete";
import {
  variantCreateSchema,
  variantIdParamSchema,
  variantUpdateSchema,
} from "./schemas";

const tags = ["Admin — Variants"];

export async function adminVariantsRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.addHook("onRequest", verifyJwt);

  router.get(
    "/admin/products/:id/variants",
    {
      schema: {
        tags,
        summary: "Listar variações de um produto",
        security: bearerSecurity,
        params: productIdParamSchema,
        response: {
          200: dataResponse(z.array(variantViewSchema)),
          401: errorResponseSchema,
        },
      },
    },
    list,
  );

  router.post(
    "/admin/products/:id/variants",
    {
      schema: {
        tags,
        summary: "Criar variação",
        security: bearerSecurity,
        params: productIdParamSchema,
        body: variantCreateSchema,
        response: {
          201: dataResponse(variantViewSchema),
          400: validationErrorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    create,
  );

  router.put(
    "/admin/variants/:id",
    {
      schema: {
        tags,
        summary: "Atualizar variação (estoque e preço próprio)",
        security: bearerSecurity,
        params: variantIdParamSchema,
        body: variantUpdateSchema,
        response: {
          200: dataResponse(variantViewSchema),
          400: validationErrorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    update,
  );

  router.delete(
    "/admin/variants/:id",
    {
      schema: {
        tags,
        summary: "Remover variação",
        security: bearerSecurity,
        params: variantIdParamSchema,
        response: {
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    remove,
  );
}
