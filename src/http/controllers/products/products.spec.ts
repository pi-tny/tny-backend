import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/utils/test/reset-database";

async function createProduct(overrides: {
  sku: string;
  name: string;
  active?: boolean;
  categoryIds?: number[];
}) {
  return prisma.product.create({
    data: {
      sku: overrides.sku,
      name: overrides.name,
      description: "desc",
      price: 89.9,
      active: overrides.active ?? true,
      categories: overrides.categoryIds
        ? { create: overrides.categoryIds.map((category_id) => ({ category_id })) }
        : undefined,
    },
  });
}

describe("Products (public) e2e", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it("should list only active products with pagination meta", async () => {
    await createProduct({ sku: "A", name: "Active" });
    await createProduct({ sku: "B", name: "Hidden", active: false });

    const response = await request(app.server).get("/products");

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe("Active");
    expect(response.body.meta.total).toBe(1);
    expect(response.body.meta.total_pages).toBe(1);
  });

  it("should search products by name", async () => {
    await createProduct({ sku: "A", name: "Camiseta Preta" });
    await createProduct({ sku: "B", name: "Calça Jeans" });

    const response = await request(app.server).get("/products?q=camiseta");

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe("Camiseta Preta");
  });

  it("should return a product detail with categories", async () => {
    const category = await prisma.category.create({
      data: { name: "Camisetas", description: null },
    });
    const product = await createProduct({
      sku: "A",
      name: "Camiseta",
      categoryIds: [category.id],
    });

    const response = await request(app.server).get(`/products/${product.id}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.id).toBe(product.id);
    expect(response.body.data.categories).toHaveLength(1);
    expect(response.body.data.variants).toEqual([]);
  });

  it("should return 404 for an inactive product", async () => {
    const product = await createProduct({
      sku: "A",
      name: "Hidden",
      active: false,
    });

    const response = await request(app.server).get(`/products/${product.id}`);

    expect(response.statusCode).toBe(404);
  });

  it("should return related products sharing a category", async () => {
    const category = await prisma.category.create({
      data: { name: "Camisetas", description: null },
    });
    const base = await createProduct({
      sku: "A",
      name: "Base",
      categoryIds: [category.id],
    });
    await createProduct({
      sku: "B",
      name: "Sibling",
      categoryIds: [category.id],
    });

    const response = await request(app.server).get(
      `/products/${base.id}/related`,
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe("Sibling");
  });
});
