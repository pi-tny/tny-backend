import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryVariantsRepository } from "@/repositories/in-memory/in-memory-variants-repository";
import { ListProductVariantsUseCase } from "./list-product-variants";

let variantsRepository: InMemoryVariantsRepository;
let sut: ListProductVariantsUseCase;

describe("List Product Variants Use Case", () => {
  beforeEach(() => {
    variantsRepository = new InMemoryVariantsRepository();
    variantsRepository.products.push({
      id: 1,
      price: 100,
      promotional_price: null,
    });
    sut = new ListProductVariantsUseCase(variantsRepository);
  });

  it("should list the variants of a product", async () => {
    await variantsRepository.create(1, {
      variant_sku: "V-1",
      color: "Preto",
      size: "M",
      quantity: 5,
    });

    const { variants } = await sut.execute({ productId: 1 });

    expect(variants).toHaveLength(1);
    expect(variants[0].final_price).toBe(100);
  });

  it("should return an empty list for a product with no variants", async () => {
    const { variants } = await sut.execute({ productId: 1 });

    expect(variants).toEqual([]);
  });
});
