import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { verifyJwt } from "@/http/middlewares/verify-jwt";
import { list } from "./list";
import { create } from "./create";
import { update } from "./update";
import { remove } from "./delete";
import { categoryBodySchema, categoryIdParamSchema } from "./schemas";

export async function adminCategoriesRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();

  // All admin category routes require a valid Bearer token.
  router.addHook("onRequest", verifyJwt);

  router.get("/admin/categories", list);
  router.post(
    "/admin/categories",
    { schema: { body: categoryBodySchema } },
    create,
  );
  router.put(
    "/admin/categories/:id",
    { schema: { params: categoryIdParamSchema, body: categoryBodySchema } },
    update,
  );
  router.delete(
    "/admin/categories/:id",
    { schema: { params: categoryIdParamSchema } },
    remove,
  );
}
