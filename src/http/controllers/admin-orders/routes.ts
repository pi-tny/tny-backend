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
import { list } from "./list";
import { get } from "./get";
import { updateStatus } from "./update-status";
import {
  listOrdersQuerySchema,
  orderDetailSchema,
  orderIdParamSchema,
  orderSummarySchema,
  updateOrderStatusSchema,
} from "@/http/controllers/orders/schemas";
import { paginationMetaSchema } from "@/http/controllers/products/schemas";

const tags = ["Admin — Orders"];

export async function adminOrdersRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.addHook("onRequest", verifyJwt);

  router.get(
    "/admin/orders",
    {
      schema: {
        tags,
        summary: "Listar pedidos",
        security: bearerSecurity,
        querystring: listOrdersQuerySchema,
        response: {
          200: z.object({
            data: z.array(orderSummarySchema),
            meta: paginationMetaSchema,
          }),
          401: errorResponseSchema,
        },
      },
    },
    list,
  );

  router.get(
    "/admin/orders/:id",
    {
      schema: {
        tags,
        summary: "Detalhe do pedido",
        security: bearerSecurity,
        params: orderIdParamSchema,
        response: {
          200: dataResponse(orderDetailSchema),
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    get,
  );

  router.patch(
    "/admin/orders/:id/status",
    {
      schema: {
        tags,
        summary: "Atualizar status do pedido",
        security: bearerSecurity,
        params: orderIdParamSchema,
        body: updateOrderStatusSchema,
        response: {
          200: dataResponse(orderDetailSchema),
          400: validationErrorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updateStatus,
  );
}
