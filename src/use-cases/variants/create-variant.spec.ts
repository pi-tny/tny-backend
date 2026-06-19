import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryVariantsRepository } from "@/repositories/in-memory/in-memory-variants-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { VariantSkuAlreadyExistsError } from "@/use-cases/errors/variant-sku-already-exists-error";
import { CreateVariantUseCase } from "./create-variant";

let variantsRepository: InMemoryVariantsRepository;
let sut: CreateVariantUseCase;

describe("Create Variant Use Case", () => {
  beforeEach(() => {
    variantsRepository = new InMemoryVariantsRepository();
    variantsRepository.products.push({
      id: 1,
      price: 100,
      promotional_price: null,
    });
    sut = new CreateVariantUseCase(variantsRepository);
  });

  it("should create a variant and resolve final_price from the product", async () => {
    const { variant } = await sut.execute({
      productId: 1,
      variant_sku: "V-1",
      color: "Preto",
      size: "M",
      quantity: 5,
    });

    expect(variant.id).toEqual(expect.any(Number));
    expect(variant.final_price).toBe(100);
  });

  it("should use the variant own price as final_price when set", async () => {
    const { variant } = await sut.execute({
      productId: 1,
      variant_sku: "V-1",
      color: "Preto",
      size: "M",
      quantity: 5,
      price: 80,
    });

    expect(variant.final_price).toBe(80);
  });

  it("should throw when the product does not exist", async () => {
    await expect(() =>
      sut.execute({
        productId: 999,
        variant_sku: "V-1",
        color: "Preto",
        size: "M",
        quantity: 5,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("should reject a duplicate variant sku", async () => {
    await sut.execute({
      productId: 1,
      variant_sku: "V-1",
      color: "Preto",
      size: "M",
      quantity: 5,
    });

    await expect(() =>
      sut.execute({
        productId: 1,
        variant_sku: "V-1",
        color: "Branco",
        size: "G",
        quantity: 2,
      }),
    ).rejects.toBeInstanceOf(VariantSkuAlreadyExistsError);
  });
});
