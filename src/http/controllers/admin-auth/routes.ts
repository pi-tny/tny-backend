import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  dataResponse,
  errorResponseSchema,
  validationErrorResponseSchema,
} from "@/http/http-schemas";
import { verifyJwt } from "@/http/middlewares/verify-jwt";
import { bearerSecurity } from "@/http/openapi";
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
        summary: "Login do administrador",
        description:
          "Retorna um JWT (Bearer, validade 1 dia). Auth é Bearer-only, sem " +
          "cookie de refresh.",
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
        summary: "Dados do admin logado",
        security: bearerSecurity,
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
        summary: "Logout",
        security: bearerSecurity,
        response: {
          401: errorResponseSchema,
        },
      },
    },
    logout,
  );
}
