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
        summary: "Cadastrar imagem do produto (por URL)",
        description:
          "A imagem é referenciada por `url` já hospedada (não há upload " +
          "binário). Com `variant_id`, é específica daquela variação; se " +
          "`null`/omitido, é imagem geral do produto.",
        security: bearerSecurity,
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
        summary: "Atualizar metadados da imagem",
        security: bearerSecurity,
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
        summary: "Remover imagem",
        security: bearerSecurity,
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
