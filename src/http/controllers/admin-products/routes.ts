import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  dataResponse,
  errorResponseSchema,
  validationErrorResponseSchema,
} from "@/http/http-schemas";
import { categorySchema } from "@/http/controllers/categories/schemas";
import { verifyJwt } from "@/http/middlewares/verify-jwt";
import { bearerSecurity } from "@/http/openapi";
import {
  productDetailSchema,
  productIdParamSchema,
  productListResponseSchema,
} from "@/http/controllers/products/schemas";
import { list } from "./list";
import { get } from "./get";
import { create } from "./create";
import { update } from "./update";
import { remove } from "./delete";
import { setCategories } from "./set-categories";
import {
  adminListProductsQuerySchema,
  productCreateSchema,
  productUpdateSchema,
  setCategoriesBodySchema,
} from "./schemas";

const tags = ["Admin — Products"];

export async function adminProductsRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.addHook("onRequest", verifyJwt);

  router.get(
    "/admin/products",
    {
      schema: {
        tags,
        summary: "Listar produtos (admin)",
        description: "Inclui produtos inativos. Filtros opcionais.",
        security: bearerSecurity,
        querystring: adminListProductsQuerySchema,
        response: {
          200: productListResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    list,
  );

  router.post(
    "/admin/products",
    {
      schema: {
        tags,
        summary: "Criar produto",
        security: bearerSecurity,
        body: productCreateSchema,
        response: {
          201: dataResponse(productDetailSchema),
          400: validationErrorResponseSchema,
          401: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    create,
  );

  router.get(
    "/admin/products/:id",
    {
      schema: {
        tags,
        summary: "Detalhe (admin)",
        security: bearerSecurity,
        params: productIdParamSchema,
        response: {
          200: dataResponse(productDetailSchema),
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    get,
  );

  router.put(
    "/admin/products/:id",
    {
      schema: {
        tags,
        summary: "Atualizar produto",
        security: bearerSecurity,
        params: productIdParamSchema,
        body: productUpdateSchema,
        response: {
          200: dataResponse(productDetailSchema),
          400: validationErrorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    update,
  );

  router.delete(
    "/admin/products/:id",
    {
      schema: {
        tags,
        summary: "Remover produto (soft delete via `active=false`)",
        security: bearerSecurity,
        params: productIdParamSchema,
        response: {
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    remove,
  );

  router.put(
    "/admin/products/:id/categories",
    {
      schema: {
        tags,
        summary: "Substituir categorias do produto",
        description: "Substitui o conjunto inteiro de categorias associadas.",
        security: bearerSecurity,
        params: productIdParamSchema,
        body: setCategoriesBodySchema,
        response: {
          200: dataResponse(z.array(categorySchema)),
          400: validationErrorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    setCategories,
  );
}
