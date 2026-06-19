import type { FastifyInstance } from "fastify";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Creates an admin and returns a valid Bearer token. Signs the JWT directly via
// the app instance so suites that aren't testing the login flow stay fast; the
// real /admin/auth/login endpoint is exercised in the auth e2e spec.
export async function createAndAuthenticate(app: FastifyInstance) {
  const admin = await prisma.admin.create({
    data: {
      name: "Admin",
      email: "admin@tny.dev",
      password_hash: await hash("password123", 6),
    },
  });

  const token = app.jwt.sign({ sub: admin.id });

  return { token, admin };
}
