import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/utils/test/reset-database";
import { createAndAuthenticate } from "@/utils/test/create-and-authenticate";

async function createVariant(overrides: {
  promotional_price?: number | null;
  variant_price?: number | null;
}) {
  const product = await prisma.product.create({
    data: {
      sku: "P-1",
      name: "Camiseta",
      description: "x",
      price: 100,
      promotional_price: overrides.promotional_price ?? null,
    },
  });
  return prisma.variant.create({
    data: {
      product_id: product.id,
      variant_sku: "V-1",
      color: "Preto",
      size: "M",
      quantity: 10,
      price: overrides.variant_price ?? null,
    },
  });
}

describe("Orders e2e", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it("should create an order, freeze details and return a whatsapp link", async () => {
    const variant = await createVariant({ variant_price: 80 });

    const response = await request(app.server)
      .post("/orders")
      .send({
        name: "Maria",
        phone: "+5585999999999",
        items: [{ variant_id: variant.id, quantity: 2 }],
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.total).toBe(160);
    expect(response.body.data.status).toBe("new");
    expect(response.body.data.whatsapp_url).toContain("https://wa.me/");

    const item = await prisma.orderItem.findFirst();
    expect(item?.product_name).toBe("Camiseta");
    expect(item?.unit_price).toBe(80);
  });

  it("should decrement variant stock after the order is created", async () => {
    const variant = await createVariant({ variant_price: 80 });

    const response = await request(app.server)
      .post("/orders")
      .send({ name: "Maria", phone: "x", items: [{ variant_id: variant.id, quantity: 3 }] });

    expect(response.statusCode).toBe(201);
    const updated = await prisma.variant.findUnique({ where: { id: variant.id } });
    expect(updated?.quantity).toBe(7);
  });

  it("should return 422 when an item exceeds available stock", async () => {
    const variant = await createVariant({ variant_price: 80 });

    const response = await request(app.server)
      .post("/orders")
      .send({ name: "Maria", phone: "x", items: [{ variant_id: variant.id, quantity: 11 }] });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.code).toBe("INSUFFICIENT_STOCK");

    // the stock must not have changed.
    const untouched = await prisma.variant.findUnique({ where: { id: variant.id } });
    expect(untouched?.quantity).toBe(10);
  });

  it("should reject an order with an empty items list", async () => {
    const response = await request(app.server)
      .post("/orders")
      .send({ name: "Maria", phone: "x", items: [] });

    expect(response.statusCode).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 404 when an item references a missing variant", async () => {
    const response = await request(app.server)
      .post("/orders")
      .send({ name: "Maria", phone: "x", items: [{ variant_id: 999, quantity: 1 }] });

    expect(response.statusCode).toBe(404);
  });

  it("should reject an order repeating the same variant_id", async () => {
    const variant = await createVariant({ variant_price: 50 });

    const response = await request(app.server)
      .post("/orders")
      .send({
        name: "Maria",
        phone: "x",
        items: [
          { variant_id: variant.id, quantity: 1 },
          { variant_id: variant.id, quantity: 2 },
        ],
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should require auth to list orders", async () => {
    const response = await request(app.server).get("/admin/orders");

    expect(response.statusCode).toBe(401);
  });

  it("should list, filter, fetch and update an order status (admin)", async () => {
    const { token } = await createAndAuthenticate(app);
    const variant = await createVariant({ promotional_price: 60 });
    await request(app.server)
      .post("/orders")
      .send({
        name: "Maria",
        phone: "x",
        items: [{ variant_id: variant.id, quantity: 1 }],
      });

    const order = await prisma.order.findFirst();

    const listResponse = await request(app.server)
      .get("/admin/orders")
      .set("Authorization", `Bearer ${token}`);
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.meta.total).toBe(1);
    expect(listResponse.body.meta.total_pages).toBe(1);

    const getResponse = await request(app.server)
      .get(`/admin/orders/${order!.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.body.data.items[0].unit_price).toBe(60);

    const patchResponse = await request(app.server)
      .patch(`/admin/orders/${order!.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "fulfilled" });
    expect(patchResponse.statusCode).toBe(200);
    expect(patchResponse.body.data.status).toBe("fulfilled");

    const filtered = await request(app.server)
      .get("/admin/orders?status=ignored")
      .set("Authorization", `Bearer ${token}`);
    expect(filtered.body.data).toHaveLength(0);
  });

  it("should reject an invalid status value", async () => {
    const { token } = await createAndAuthenticate(app);
    const variant = await createVariant({ variant_price: 50 });
    await request(app.server)
      .post("/orders")
      .send({
        name: "Maria",
        phone: "x",
        items: [{ variant_id: variant.id, quantity: 1 }],
      });
    const order = await prisma.order.findFirst();

    const response = await request(app.server)
      .patch(`/admin/orders/${order!.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "shipped" });

    expect(response.statusCode).toBe(400);
  });

  it("should filter the admin order list by date range", async () => {
    const { token } = await createAndAuthenticate(app);
    await prisma.order.create({
      data: {
        name: "Old",
        phone: "x",
        total: 10,
        created_at: new Date("2026-06-10T12:00:00Z"),
      },
    });
    await prisma.order.create({
      data: {
        name: "Recent",
        phone: "x",
        total: 10,
        created_at: new Date("2026-06-20T12:00:00Z"),
      },
    });

    const response = await request(app.server)
      .get("/admin/orders?date_from=2026-06-09&date_to=2026-06-15")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe("Old");
  });

  it("should require auth on admin order read/update routes", async () => {
    const detail = await request(app.server).get("/admin/orders/1");
    const patch = await request(app.server)
      .patch("/admin/orders/1/status")
      .send({ status: "fulfilled" });

    expect(detail.statusCode).toBe(401);
    expect(patch.statusCode).toBe(401);
  });
});
