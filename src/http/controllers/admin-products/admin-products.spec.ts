import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/utils/test/reset-database";
import { createAndAuthenticate } from "@/utils/test/create-and-authenticate";

describe("Admin Products e2e", () => {
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
    const response = await request(app.server).get("/admin/products");

    expect(response.statusCode).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("should create a product with categories", async () => {
    const { token } = await createAndAuthenticate(app);
    const category = await prisma.category.create({
      data: { name: "Camisetas", description: null },
    });

    const response = await request(app.server)
      .post("/admin/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        sku: "SKU-1",
        name: "Camiseta",
        description: "100% algodão",
        price: 89.9,
        category_ids: [category.id],
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.id).toEqual(expect.any(Number));
    expect(response.body.data.categories).toHaveLength(1);
  });

  it("should reject a duplicate sku with 409", async () => {
    const { token } = await createAndAuthenticate(app);
    await prisma.product.create({
      data: { sku: "SKU-1", name: "A", description: "x", price: 10 },
    });

    const response = await request(app.server)
      .post("/admin/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ sku: "SKU-1", name: "B", description: "y", price: 20 });

    expect(response.statusCode).toBe(409);
    expect(response.body.error.code).toBe("PRODUCT_SKU_ALREADY_EXISTS");
  });

  it("should list products including inactive ones", async () => {
    const { token } = await createAndAuthenticate(app);
    await prisma.product.create({
      data: { sku: "A", name: "Active", description: "x", price: 10 },
    });
    await prisma.product.create({
      data: {
        sku: "B",
        name: "Hidden",
        description: "x",
        price: 10,
        active: false,
      },
    });

    const response = await request(app.server)
      .get("/admin/products")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveLength(2);
  });

  it("should update a product", async () => {
    const { token } = await createAndAuthenticate(app);
    const product = await prisma.product.create({
      data: { sku: "A", name: "Old", description: "x", price: 10 },
    });

    const response = await request(app.server)
      .put(`/admin/products/${product.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "New", promotional_price: 8 });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.name).toBe("New");
    expect(response.body.data.promotional_price).toBe(8);
  });

  it("should return 404 when updating a missing product", async () => {
    const { token } = await createAndAuthenticate(app);

    const response = await request(app.server)
      .put("/admin/products/999")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "X" });

    expect(response.statusCode).toBe(404);
  });

  it("should soft delete a product (hidden from public, visible to admin)", async () => {
    const { token } = await createAndAuthenticate(app);
    const product = await prisma.product.create({
      data: { sku: "A", name: "P", description: "x", price: 10 },
    });

    const deleteResponse = await request(app.server)
      .delete(`/admin/products/${product.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleteResponse.statusCode).toBe(204);

    const publicResponse = await request(app.server).get(
      `/products/${product.id}`,
    );
    expect(publicResponse.statusCode).toBe(404);

    const adminResponse = await request(app.server)
      .get(`/admin/products/${product.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(adminResponse.statusCode).toBe(200);
    expect(adminResponse.body.data.active).toBe(false);
  });

  it("should replace the product categories", async () => {
    const { token } = await createAndAuthenticate(app);
    const [a, b] = await Promise.all([
      prisma.category.create({ data: { name: "A", description: null } }),
      prisma.category.create({ data: { name: "B", description: null } }),
    ]);
    const product = await prisma.product.create({
      data: {
        sku: "A",
        name: "P",
        description: "x",
        price: 10,
        categories: { create: [{ category_id: a.id }] },
      },
    });

    const response = await request(app.server)
      .put(`/admin/products/${product.id}/categories`)
      .set("Authorization", `Bearer ${token}`)
      .send({ category_ids: [b.id] });

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe(b.id);
  });
});
