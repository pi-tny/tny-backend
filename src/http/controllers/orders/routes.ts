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
