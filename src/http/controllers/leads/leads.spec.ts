import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/utils/test/reset-database";
import { createAndAuthenticate } from "@/utils/test/create-and-authenticate";

describe("Leads e2e", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it("should register a lead (public)", async () => {
    const response = await request(app.server)
      .post("/leads")
      .send({ name: "Maria", email: "maria@example.com", phone: "+5585999999999" });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.marketing_consent).toBe(true);
  });

  it("should upsert by email instead of duplicating", async () => {
    await request(app.server)
      .post("/leads")
      .send({ name: "Maria", email: "maria@example.com", phone: "1" });
    await request(app.server)
      .post("/leads")
      .send({ name: "Maria Silva", email: "maria@example.com", phone: "2" });

    expect(await prisma.lead.count()).toBe(1);
    const lead = await prisma.lead.findUnique({
      where: { email: "maria@example.com" },
    });
    expect(lead?.name).toBe("Maria Silva");
  });

  it("should reject a malformed email", async () => {
    const response = await request(app.server)
      .post("/leads")
      .send({ name: "Maria", email: "nope", phone: "1" });

    expect(response.statusCode).toBe(400);
  });

  it("should require auth to list leads", async () => {
    const response = await request(app.server).get("/admin/leads");

    expect(response.statusCode).toBe(401);
  });

  it("should list and delete leads (admin)", async () => {
    const { token } = await createAndAuthenticate(app);
    const lead = await prisma.lead.create({
      data: { name: "Maria", email: "maria@example.com", phone: "1" },
    });

    const listResponse = await request(app.server)
      .get("/admin/leads")
      .set("Authorization", `Bearer ${token}`);
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.meta.total).toBe(1);

    const deleteResponse = await request(app.server)
      .delete(`/admin/leads/${lead.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleteResponse.statusCode).toBe(204);
    expect(await prisma.lead.count()).toBe(0);
  });

  it("should return 404 when deleting a missing lead", async () => {
    const { token } = await createAndAuthenticate(app);

    const response = await request(app.server)
      .delete("/admin/leads/999")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it("should require auth to delete a lead", async () => {
    const response = await request(app.server).delete("/admin/leads/1");

    expect(response.statusCode).toBe(401);
  });
});
