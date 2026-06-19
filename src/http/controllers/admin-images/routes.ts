import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  dataResponse,
  errorResponseSchema,
  validationErrorResponseSchema,
} from "@/http/http-schemas";
import { verifyJwt } from "@/http/middlewares/verify-jwt";
import {
  imageSchema,
  productIdParamSchema,
} from "@/http/controllers/products/schemas";
import { create } from "./create";
import { update } from "./update";
import { remove } from "./delete";
import {
  imageCreateSchema,
  imageIdParamSchema,
  imageUpdateSchema,
} from "./schemas";

const tags = ["Admin — Images"];

export async function adminImagesRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.addHook("onRequest", verifyJwt);

  router.post(
    "/admin/products/:id/images",
    {
      schema: {
        tags,
        params: productIdParamSchema,
        body: imageCreateSchema,
        response: {
          201: dataResponse(imageSchema),
          400: validationErrorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    create,
  );

  router.put(
    "/admin/images/:id",
    {
      schema: {
        tags,
        params: imageIdParamSchema,
        body: imageUpdateSchema,
        response: {
          200: dataResponse(imageSchema),
          400: validationErrorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    update,
  );

  router.delete(
    "/admin/images/:id",
    {
      schema: {
        tags,
        params: imageIdParamSchema,
        response: {
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    remove,
  );
}
