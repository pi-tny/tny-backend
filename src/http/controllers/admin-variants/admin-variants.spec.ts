import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/utils/test/reset-database";
import { createAndAuthenticate } from "@/utils/test/create-and-authenticate";

async function createProduct(promotional_price: number | null = null) {
  return prisma.product.create({
    data: {
      sku: "P-1",
      name: "Camiseta",
      description: "x",
      price: 100,
      promotional_price,
    },
  });
}

describe("Admin Variants e2e", () => {
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
    const response = await request(app.server).get(
      "/admin/products/1/variants",
    );

    expect(response.statusCode).toBe(401);
  });

  it("should create a variant and resolve final_price (promotion wins)", async () => {
    const { token } = await createAndAuthenticate(app);
    const product = await createProduct(70);

    const response = await request(app.server)
      .post(`/admin/products/${product.id}/variants`)
      .set("Authorization", `Bearer ${token}`)
      .send({ variant_sku: "V-1", color: "Preto", size: "M", quantity: 5, price: 90 });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.final_price).toBe(70);
  });

  it("should return 404 when creating a variant for a missing product", async () => {
    const { token } = await createAndAuthenticate(app);

    const response = await request(app.server)
      .post("/admin/products/999/variants")
      .set("Authorization", `Bearer ${token}`)
      .send({ variant_sku: "V-1", color: "Preto", size: "M", quantity: 5 });

    expect(response.statusCode).toBe(404);
  });

  it("should reject a duplicate variant sku with 409", async () => {
    const { token } = await createAndAuthenticate(app);
    const product = await createProduct();
    await prisma.variant.create({
      data: {
        product_id: product.id,
        variant_sku: "V-1",
        color: "Preto",
        size: "M",
        quantity: 5,
      },
    });

    const response = await request(app.server)
      .post(`/admin/products/${product.id}/variants`)
      .set("Authorization", `Bearer ${token}`)
      .send({ variant_sku: "V-1", color: "Branco", size: "G", quantity: 2 });

    expect(response.statusCode).toBe(409);
    expect(response.body.error.code).toBe("VARIANT_SKU_ALREADY_EXISTS");
  });

  it("should list, update and delete a variant", async () => {
    const { token } = await createAndAuthenticate(app);
    const product = await createProduct();
    const variant = await prisma.variant.create({
      data: {
        product_id: product.id,
        variant_sku: "V-1",
        color: "Preto",
        size: "M",
        quantity: 5,
      },
    });

    const listResponse = await request(app.server)
      .get(`/admin/products/${product.id}/variants`)
      .set("Authorization", `Bearer ${token}`);
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);

    const updateResponse = await request(app.server)
      .put(`/admin/variants/${variant.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 12, price: 80 });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.data.quantity).toBe(12);
    expect(updateResponse.body.data.final_price).toBe(80);

    const deleteResponse = await request(app.server)
      .delete(`/admin/variants/${variant.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleteResponse.statusCode).toBe(204);
    expect(await prisma.variant.count()).toBe(0);
  });

  it("should return 404 when deleting a missing variant", async () => {
    const { token } = await createAndAuthenticate(app);

    const response = await request(app.server)
      .delete("/admin/variants/999")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });
});
