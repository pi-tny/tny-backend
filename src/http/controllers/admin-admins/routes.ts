import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  dataResponse,
  errorResponseSchema,
  validationErrorResponseSchema,
} from "@/http/http-schemas";
import { verifyJwt } from "@/http/middlewares/verify-jwt";
import { adminSchema } from "@/http/controllers/admin-auth/schemas";
import { list } from "./list";
import { create } from "./create";
import { update } from "./update";
import { remove } from "./delete";
import {
  adminCreateSchema,
  adminIdParamSchema,
  adminUpdateSchema,
} from "./schemas";

const tags = ["Admin — Administrators"];

export async function adminAdminsRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.addHook("onRequest", verifyJwt);

  router.get(
    "/admin/admins",
    {
      schema: {
        tags,
        response: {
          200: dataResponse(z.array(adminSchema)),
          401: errorResponseSchema,
        },
      },
    },
    list,
  );

  router.post(
    "/admin/admins",
    {
      schema: {
        tags,
        body: adminCreateSchema,
        response: {
          201: dataResponse(adminSchema),
          400: validationErrorResponseSchema,
          401: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    create,
  );

  router.put(
    "/admin/admins/:id",
    {
      schema: {
        tags,
        params: adminIdParamSchema,
        body: adminUpdateSchema,
        response: {
          200: dataResponse(adminSchema),
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
    "/admin/admins/:id",
    {
      schema: {
        tags,
        params: adminIdParamSchema,
        response: {
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    remove,
  );
}
