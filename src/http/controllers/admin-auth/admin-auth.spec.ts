import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { hash } from "bcryptjs";
import { app } from "@/app";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/utils/test/reset-database";
import { createAndAuthenticate } from "@/utils/test/create-and-authenticate";

describe("Admin Auth e2e", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it("should log in with valid credentials", async () => {
    await prisma.admin.create({
      data: {
        name: "Admin",
        email: "admin@tny.dev",
        password_hash: await hash("password123", 6),
      },
    });

    const response = await request(app.server)
      .post("/admin/auth/login")
      .send({ email: "admin@tny.dev", password: "password123" });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.token).toEqual(expect.any(String));
  });

  it("should reject invalid credentials", async () => {
    await prisma.admin.create({
      data: {
        name: "Admin",
        email: "admin@tny.dev",
        password_hash: await hash("password123", 6),
      },
    });

    const response = await request(app.server)
      .post("/admin/auth/login")
      .send({ email: "admin@tny.dev", password: "wrong-password" });

    expect(response.statusCode).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("should reject a malformed email with a validation error", async () => {
    const response = await request(app.server)
      .post("/admin/auth/login")
      .send({ email: "not-an-email", password: "password123" });

    expect(response.statusCode).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should lock the account after 5 failed attempts (423)", async () => {
    await prisma.admin.create({
      data: {
        name: "Admin",
        email: "admin@tny.dev",
        password_hash: await hash("password123", 6),
      },
    });

    // 4 failures -> 401; the 5th hits the limit -> 423 (locked).
    for (let i = 0; i < 4; i++) {
      const r = await request(app.server)
        .post("/admin/auth/login")
        .send({ email: "admin@tny.dev", password: "wrong" });
      expect(r.statusCode).toBe(401);
    }

    const locking = await request(app.server)
      .post("/admin/auth/login")
      .send({ email: "admin@tny.dev", password: "wrong" });
    expect(locking.statusCode).toBe(423);
    expect(locking.body.error.code).toBe("ACCOUNT_LOCKED");

    // even with the correct password, it stays locked.
    const correct = await request(app.server)
      .post("/admin/auth/login")
      .send({ email: "admin@tny.dev", password: "password123" });
    expect(correct.statusCode).toBe(423);
  });

  it("should return the profile of the authenticated admin without the password hash", async () => {
    const { token, admin } = await createAndAuthenticate(app);

    const response = await request(app.server)
      .get("/admin/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.email).toBe(admin.email);
    expect(response.body.data.password_hash).toBeUndefined();
  });

  it("should require authentication for the profile", async () => {
    const response = await request(app.server).get("/admin/auth/me");

    expect(response.statusCode).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("should log out an authenticated admin", async () => {
    const { token } = await createAndAuthenticate(app);

    const response = await request(app.server)
      .post("/admin/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
  });
});
