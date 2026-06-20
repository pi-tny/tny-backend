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

  it("should return 400 for a non-numeric product id", async () => {
    const response = await request(app.server).get("/products/abc");

    expect(response.statusCode).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when limit exceeds the maximum", async () => {
    const response = await request(app.server).get("/products?limit=101");

    expect(response.statusCode).toBe(400);
  });

  it("should return 400 when page is below 1", async () => {
    const response = await request(app.server).get("/products?page=0");

    expect(response.statusCode).toBe(400);
  });

  it("should filter by price range and sort by price", async () => {
    await prisma.product.create({
      data: { sku: "a", name: "Cheap", description: "x", price: 10 },
    });
    await prisma.product.create({
      data: { sku: "b", name: "Mid", description: "x", price: 50 },
    });
    await prisma.product.create({
      data: { sku: "c", name: "Pricey", description: "x", price: 100 },
    });

    const ranged = await request(app.server).get(
      "/products?min_price=20&max_price=80",
    );
    expect(ranged.body.data).toHaveLength(1);
    expect(ranged.body.data[0].name).toBe("Mid");

    const sorted = await request(app.server).get("/products?sort=price_asc");
    expect(sorted.body.data.map((p: { price: number }) => p.price)).toEqual([
      10, 50, 100,
    ]);
  });

  it("should filter on_sale products", async () => {
    await prisma.product.create({
      data: { sku: "a", name: "Full", description: "x", price: 50 },
    });
    await prisma.product.create({
      data: {
        sku: "b",
        name: "Promo",
        description: "x",
        price: 50,
        promotional_price: 30,
      },
    });

    const response = await request(app.server).get("/products?on_sale=true");

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe("Promo");
  });

  it("should filter in_stock products", async () => {
    const stocked = await prisma.product.create({
      data: { sku: "a", name: "InStock", description: "x", price: 10 },
    });
    await prisma.product.create({
      data: { sku: "b", name: "OutOfStock", description: "x", price: 10 },
    });
    await prisma.variant.create({
      data: {
        product_id: stocked.id,
        variant_sku: "V-1",
        color: "Preto",
        size: "M",
        quantity: 5,
      },
    });

    const response = await request(app.server).get("/products?in_stock=true");

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe("InStock");
  });
});
