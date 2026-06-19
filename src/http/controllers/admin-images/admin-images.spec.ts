import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/utils/test/reset-database";
import { createAndAuthenticate } from "@/utils/test/create-and-authenticate";

async function createProduct() {
  return prisma.product.create({
    data: { sku: "P-1", name: "Camiseta", description: "x", price: 100 },
  });
}

describe("Admin Images e2e", () => {
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
    const response = await request(app.server)
      .post("/admin/products/1/images")
      .send({ url: "a.jpg" });

    expect(response.statusCode).toBe(401);
  });

  it("should add a general product image and surface it as cover_image", async () => {
    const { token } = await createAndAuthenticate(app);
    const product = await createProduct();

    const response = await request(app.server)
      .post(`/admin/products/${product.id}/images`)
      .set("Authorization", `Bearer ${token}`)
      .send({ url: "cover.jpg", alt_text: "Frente" });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.url).toBe("cover.jpg");

    const detail = await request(app.server).get(`/products/${product.id}`);
    expect(detail.body.data.cover_image).toBe("cover.jpg");
    expect(detail.body.data.images).toHaveLength(1);
  });

  it("should return 404 when the product does not exist", async () => {
    const { token } = await createAndAuthenticate(app);

    const response = await request(app.server)
      .post("/admin/products/999/images")
      .set("Authorization", `Bearer ${token}`)
      .send({ url: "a.jpg" });

    expect(response.statusCode).toBe(404);
  });

  it("should update and delete an image", async () => {
    const { token } = await createAndAuthenticate(app);
    const product = await createProduct();
    const image = await prisma.image.create({
      data: { product_id: product.id, url: "a.jpg", position: 0 },
    });

    const updateResponse = await request(app.server)
      .put(`/admin/images/${image.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ position: 5, alt_text: "Costas" });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.data.position).toBe(5);

    const deleteResponse = await request(app.server)
      .delete(`/admin/images/${image.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleteResponse.statusCode).toBe(204);
    expect(await prisma.image.count()).toBe(0);
  });

  it("should return 404 when deleting a missing image", async () => {
    const { token } = await createAndAuthenticate(app);

    const response = await request(app.server)
      .delete("/admin/images/999")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });
});
