import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  errorResponseSchema,
  validationErrorResponseSchema,
} from "@/http/http-schemas";
import { create } from "./create";
import { orderCreateSchema, orderCreatedResponseSchema } from "./schemas";

const tags = ["Orders (public)"];

export async function ordersRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.post(
    "/orders",
    {
      schema: {
        tags,
        summary: "Criar pedido (antes do redirect ao WhatsApp)",
        description:
          "Registra o pedido com itens congelados (nome, cor, tamanho, preço " +
          "unitário pela regra de herança + promoção) e retorna `id` e " +
          "`whatsapp_url` pronta. `status` inicial é `new`.",
        body: orderCreateSchema,
        response: {
          201: orderCreatedResponseSchema,
          400: validationErrorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    create,
  );
}
