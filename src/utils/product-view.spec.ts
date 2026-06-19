import { describe, expect, it } from "vitest";
import { resolveCoverImage, resolveFinalPrice } from "./product-view";

describe("resolveFinalPrice", () => {
  it("prefers the product promotional price over everything", () => {
    expect(
      resolveFinalPrice({ price: 100, promotional_price: 70 }, { price: 90 }),
    ).toBe(70);
  });

  it("falls back to the variant own price when no promotion", () => {
    expect(
      resolveFinalPrice({ price: 100, promotional_price: null }, { price: 90 }),
    ).toBe(90);
  });

  it("falls back to the product base price when the variant has none", () => {
    expect(
      resolveFinalPrice({ price: 100, promotional_price: null }, { price: null }),
    ).toBe(100);
  });
});

describe("resolveCoverImage", () => {
  it("returns null when there are no images", () => {
    expect(resolveCoverImage([])).toBeNull();
  });

  it("prefers the lowest-position general image", () => {
    const url = resolveCoverImage([
      { url: "b.jpg", position: 1, variant_id: null },
      { url: "a.jpg", position: 0, variant_id: null },
      { url: "v.jpg", position: 0, variant_id: 5 },
    ]);
    expect(url).toBe("a.jpg");
  });

  it("falls back to a variant image when there is no general image", () => {
    const url = resolveCoverImage([
      { url: "v.jpg", position: 0, variant_id: 5 },
    ]);
    expect(url).toBe("v.jpg");
  });
});
