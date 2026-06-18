import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/utils/test/reset-database";

describe("Categories (public) e2e", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it("should list categories", async () => {
    await prisma.category.createMany({
      data: [
        { name: "Camisetas", description: null },
        { name: "Calças", description: null },
      ],
    });

    const response = await request(app.server).get("/categories");

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0]).toHaveProperty("id");
  });

  it("should get a category by id", async () => {
    const category = await prisma.category.create({
      data: { name: "Acessórios", description: "Diversos" },
    });

    const response = await request(app.server).get(
      `/categories/${category.id}`,
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.data.name).toBe("Acessórios");
  });

  it("should return 404 for a missing category", async () => {
    const response = await request(app.server).get("/categories/999");

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });
});
