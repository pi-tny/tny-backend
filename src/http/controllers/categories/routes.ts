import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { dataResponse, errorResponseSchema } from "@/http/http-schemas";
import { list } from "./list";
import { get } from "./get";
import {
  categoryIdParamSchema,
  categoryListResponseSchema,
  categorySchema,
  listCategoriesQuerySchema,
} from "./schemas";

const tags = ["Categories (public)"];

export async function categoriesRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.get(
    "/categories",
    {
      schema: {
        tags,
        summary: "Listar categorias",
        querystring: listCategoriesQuerySchema,
        response: { 200: categoryListResponseSchema },
      },
    },
    list,
  );

  router.get(
    "/categories/:id",
    {
      schema: {
        tags,
        summary: "Detalhe de uma categoria",
        params: categoryIdParamSchema,
        response: {
          200: dataResponse(categorySchema),
          404: errorResponseSchema,
        },
      },
    },
    get,
  );
}
