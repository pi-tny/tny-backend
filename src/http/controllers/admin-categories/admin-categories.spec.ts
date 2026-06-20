import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/utils/test/reset-database";
import { createAndAuthenticate } from "@/utils/test/create-and-authenticate";

describe("Admin Categories e2e", () => {
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
    const response = await request(app.server).get("/admin/categories");

    expect(response.statusCode).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("should list categories when authenticated", async () => {
    const { token } = await createAndAuthenticate(app);
    await prisma.category.create({
      data: { name: "Camisetas", description: null },
    });

    const response = await request(app.server)
      .get("/admin/categories")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  it("should create a category", async () => {
    const { token } = await createAndAuthenticate(app);

    const response = await request(app.server)
      .post("/admin/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Lançamentos", description: "Novidades" });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.id).toEqual(expect.any(Number));
    expect(response.body.data.name).toBe("Lançamentos");
  });

  it("should reject creating a category with an empty name", async () => {
    const { token } = await createAndAuthenticate(app);

    const response = await request(app.server)
      .post("/admin/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "" });

    expect(response.statusCode).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should update a category", async () => {
    const { token } = await createAndAuthenticate(app);
    const category = await prisma.category.create({
      data: { name: "Calsas", description: null },
    });

    const response = await request(app.server)
      .put(`/admin/categories/${category.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Calças" });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.name).toBe("Calças");
  });

  it("should return 404 when updating a missing category", async () => {
    const { token } = await createAndAuthenticate(app);

    const response = await request(app.server)
      .put("/admin/categories/999")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "X" });

    expect(response.statusCode).toBe(404);
  });

  it("should delete a category", async () => {
    const { token } = await createAndAuthenticate(app);
    const category = await prisma.category.create({
      data: { name: "Bermudas", description: null },
    });

    const response = await request(app.server)
      .delete(`/admin/categories/${category.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
    expect(await prisma.category.count()).toBe(0);
  });

  it("should return 404 when deleting a missing category", async () => {
    const { token } = await createAndAuthenticate(app);

    const response = await request(app.server)
      .delete("/admin/categories/999")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it("should require auth on every write verb", async () => {
    const post = await request(app.server)
      .post("/admin/categories")
      .send({ name: "x" });
    const put = await request(app.server)
      .put("/admin/categories/1")
      .send({ name: "x" });
    const del = await request(app.server).delete("/admin/categories/1");

    expect(post.statusCode).toBe(401);
    expect(put.statusCode).toBe(401);
    expect(del.statusCode).toBe(401);
  });
});
