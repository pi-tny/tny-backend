import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "@/app";

// Parity guard for the swagger migration: the OpenAPI doc is now generated from
// the routes' Zod schemas (no more static docs/openapi.yaml). This locks in that
// the global metadata, security scheme, summaries, pagination params and the
// per-route security all still reach /docs/json.
describe("OpenAPI docs (generated)", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("serves a generated spec with the global metadata", async () => {
    const response = await app.inject({ method: "GET", url: "/docs/json" });

    expect(response.statusCode).toBe(200);
    const spec = response.json();

    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.info.title).toBe("TNY Catálogo — API");
    expect(spec.info.version).toBe("1.0.0");
    expect(spec.servers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ description: "Produção" }),
      ]),
    );
    expect(spec.components.securitySchemes.bearerAuth).toMatchObject({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });
  });

  it("keeps tags, summaries and pagination params on public routes", async () => {
    const spec = (
      await app.inject({ method: "GET", url: "/docs/json" })
    ).json();

    const listCategories = spec.paths["/categories"].get;
    expect(listCategories.tags).toContain("Categories (public)");
    expect(listCategories.summary).toBe("Listar categorias");
    expect(
      listCategories.parameters.some(
        (param: { name: string }) => param.name === "page",
      ),
    ).toBe(true);
  });

  it("marks admin routes as Bearer-secured", async () => {
    const spec = (
      await app.inject({ method: "GET", url: "/docs/json" })
    ).json();

    expect(spec.paths["/admin/products"].get.security).toEqual([
      { bearerAuth: [] },
    ]);
  });

  it("exposes reusable schemas as named $ref components", async () => {
    const spec = (
      await app.inject({ method: "GET", url: "/docs/json" })
    ).json();

    // named components exist
    expect(spec.components.schemas.Category).toBeTruthy();
    expect(spec.components.schemas.ProductDetail).toBeTruthy();

    // and responses reference them instead of inlining
    const categoryItems =
      spec.paths["/categories"].get.responses["200"].content[
        "application/json"
      ].schema.properties.data.items;
    expect(categoryItems).toEqual({ $ref: "#/components/schemas/Category" });
  });
});
