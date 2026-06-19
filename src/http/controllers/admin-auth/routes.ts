import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  dataResponse,
  errorResponseSchema,
  validationErrorResponseSchema,
} from "@/http/http-schemas";
import { verifyJwt } from "@/http/middlewares/verify-jwt";
import { authenticate } from "./authenticate";
import { profile } from "./profile";
import { logout } from "./logout";
import { adminSchema, loginBodySchema, tokenSchema } from "./schemas";

const tags = ["Authentication"];

export async function adminAuthRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.post(
    "/admin/auth/login",
    {
      schema: {
        tags,
        body: loginBodySchema,
        response: {
          200: dataResponse(tokenSchema),
          400: validationErrorResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    authenticate,
  );

  router.get(
    "/admin/auth/me",
    {
      onRequest: [verifyJwt],
      schema: {
        tags,
        response: {
          200: dataResponse(adminSchema),
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    profile,
  );

  router.post(
    "/admin/auth/logout",
    {
      onRequest: [verifyJwt],
      schema: {
        tags,
        response: {
          401: errorResponseSchema,
        },
      },
    },
    logout,
  );
}
