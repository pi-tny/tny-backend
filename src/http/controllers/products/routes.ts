import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { dataResponse, errorResponseSchema } from "@/http/http-schemas";
import { list } from "./list";
import { get } from "./get";
import { related } from "./related";
import {
  listProductsQuerySchema,
  productDetailSchema,
  productIdParamSchema,
  productListResponseSchema,
  productSummarySchema,
  relatedQuerySchema,
} from "./schemas";

const tags = ["Products (public)"];

export async function productsRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.get(
    "/products",
    {
      schema: {
        tags,
        querystring: listProductsQuerySchema,
        response: { 200: productListResponseSchema },
      },
    },
    list,
  );

  router.get(
    "/products/:id",
    {
      schema: {
        tags,
        params: productIdParamSchema,
        response: {
          200: dataResponse(productDetailSchema),
          404: errorResponseSchema,
        },
      },
    },
    get,
  );

  router.get(
    "/products/:id/related",
    {
      schema: {
        tags,
        params: productIdParamSchema,
        querystring: relatedQuerySchema,
        response: {
          200: dataResponse(z.array(productSummarySchema)),
          404: errorResponseSchema,
        },
      },
    },
    related,
  );
}
