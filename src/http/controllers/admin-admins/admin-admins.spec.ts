import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/utils/test/reset-database";
import { createAndAuthenticate } from "@/utils/test/create-and-authenticate";

describe("Admin Administrators e2e", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it("should require authentication", async () => {
    const response = await request(app.server).get("/admin/admins");

    expect(response.statusCode).toBe(401);
  });

  it("should create an admin without leaking the password hash", async () => {
    const { token } = await createAndAuthenticate(app);

    const response = await request(app.server)
      .post("/admin/admins")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "New", email: "new@tny.dev", password: "password123" });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.email).toBe("new@tny.dev");
    expect(response.body.data.password_hash).toBeUndefined();
  });

  it("should reject a duplicate email with 409", async () => {
    const { token } = await createAndAuthenticate(app);

    const response = await request(app.server)
      .post("/admin/admins")
      .set("Authorization", `Bearer ${token}`)
      // createAndAuthenticate already created admin@tny.dev
      .send({ name: "Dup", email: "admin@tny.dev", password: "password123" });

    expect(response.statusCode).toBe(409);
    expect(response.body.error.code).toBe("ADMIN_ALREADY_EXISTS");
  });

  it("should list admins", async () => {
    const { token } = await createAndAuthenticate(app);

    const response = await request(app.server)
      .get("/admin/admins")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  it("should update an admin", async () => {
    const { token } = await createAndAuthenticate(app);
    const other = await prisma.admin.create({
      data: { name: "Other", email: "other@tny.dev", password_hash: "h" },
    });

    const response = await request(app.server)
      .put(`/admin/admins/${other.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Renamed", active: false });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.name).toBe("Renamed");
    expect(response.body.data.active).toBe(false);
  });

  it("should delete an admin", async () => {
    const { token } = await createAndAuthenticate(app);
    const other = await prisma.admin.create({
      data: { name: "Other", email: "other@tny.dev", password_hash: "h" },
    });

    const response = await request(app.server)
      .delete(`/admin/admins/${other.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
    expect(await prisma.admin.count()).toBe(1);
  });

  it("should return 404 when updating a missing admin", async () => {
    const { token } = await createAndAuthenticate(app);

    const response = await request(app.server)
      .put("/admin/admins/999")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "X" });

    expect(response.statusCode).toBe(404);
  });
});
