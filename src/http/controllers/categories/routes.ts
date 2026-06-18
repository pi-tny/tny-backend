import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { dataResponse, errorResponseSchema } from "@/http/http-schemas";
import { list } from "./list";
import { get } from "./get";
import { categoryIdParamSchema, categorySchema } from "./schemas";

const tags = ["Categories (public)"];

export async function categoriesRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.get(
    "/categories",
    {
      schema: {
        tags,
        response: { 200: dataResponse(z.array(categorySchema)) },
      },
    },
    list,
  );

  router.get(
    "/categories/:id",
    {
      schema: {
        tags,
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
