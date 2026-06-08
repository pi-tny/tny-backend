import fastify from "fastify";
import { ZodError } from "zod";
import path from "node:path";
import { env } from "./env";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import cors from "@fastify/cors";
import {
  serializerCompiler,
  validatorCompiler,
  // jsonSchemaTransform,
} from "fastify-type-provider-zod";

import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

export const app = fastify();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(cors, {
  origin: "*",
});

// app.register(fastifySwagger, {
//   openapi: {
//     info: {
//       title: "Minha API Fastify",
//       description: "Documentação da API do sistema.",
//       version: "1.0.0",
//     },
//   },
//   transform: jsonSchemaTransform,
// });

app.register(fastifySwagger, {
  mode: 'static',
  specification: {
    path: path.resolve(__dirname, "../docs/openapi.yaml"),
    baseDir: path.resolve(__dirname, "../docs"), 
  },
});

app.register(fastifySwaggerUi, {
  routePrefix: "/docs",
});

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  cookie: {
    cookieName: "refreshToken",
    signed: false,
  },
  sign: {
    expiresIn: "10m",
  },
});

app.register(fastifyCookie);

app.setErrorHandler((error, _, reply) => {
  if (error instanceof ZodError) {
    return reply
      .status(400)
      .send({ message: "Validation error", issues: error.format() });
  }

  if (env.NODE_ENV !== "production") {
    console.error(error);
  } else {
    // TODO: here we should log to an external tool like Datadog/NewRelic/Sentry
  }

  return reply.status(500).send({ message: "Internal Server Error" });
});
