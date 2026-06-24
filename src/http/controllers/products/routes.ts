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
        summary: "Listar produtos (com filtros e busca)",
        description:
          "Retorna produtos ativos. Suporta busca por nome, filtro por " +
          "categoria, faixa de preço (base), promoção e estoque, além de " +
          "ordenação. Cada produto traz `cover_image` resolvida e `price` base " +
          "(e `promotional_price` se em promoção).",
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
        summary: "Detalhe completo do produto",
        description:
          "Retorna o produto com suas variações, imagens e categorias. Cada " +
          "variação retorna `final_price` (regra de herança + promoção) e " +
          "`quantity` (estoque).",
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
        summary: 'Produtos relacionados ("Veja também")',
        description:
          "Produtos ativos das mesmas categorias do produto informado, " +
          "excluindo ele próprio. Ordem aleatória, limitado a `limit`.",
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
