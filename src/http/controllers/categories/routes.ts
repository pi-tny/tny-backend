import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { list } from "./list";
import { get } from "./get";
import { categoryIdParamSchema } from "./schemas";

export async function categoriesRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.get("/categories", list);
  router.get(
    "/categories/:id",
    { schema: { params: categoryIdParamSchema } },
    get,
  );
}
