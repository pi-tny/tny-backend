import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryVariantsRepository } from "@/repositories/in-memory/in-memory-variants-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { VariantSkuAlreadyExistsError } from "@/use-cases/errors/variant-sku-already-exists-error";
import { UpdateVariantUseCase } from "./update-variant";

let variantsRepository: InMemoryVariantsRepository;
let sut: UpdateVariantUseCase;

async function seed(sku: string) {
  const variant = await variantsRepository.create(1, {
    variant_sku: sku,
    color: "Preto",
    size: "M",
    quantity: 5,
  });
  return variant!;
}

describe("Update Variant Use Case", () => {
  beforeEach(() => {
    variantsRepository = new InMemoryVariantsRepository();
    variantsRepository.products.push({
      id: 1,
      price: 100,
      promotional_price: null,
    });
    sut = new UpdateVariantUseCase(variantsRepository);
  });

  it("should update stock and price", async () => {
    const created = await seed("V-1");

    const { variant } = await sut.execute({
      id: created.id,
      quantity: 12,
      price: 70,
    });

    expect(variant.quantity).toBe(12);
    expect(variant.final_price).toBe(70);
  });

  it("should throw when the variant does not exist", async () => {
    await expect(() =>
      sut.execute({ id: 999, quantity: 1 }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("should reject changing to a sku used by another variant", async () => {
    await seed("V-1");
    const second = await seed("V-2");

    await expect(() =>
      sut.execute({ id: second.id, variant_sku: "V-1" }),
    ).rejects.toBeInstanceOf(VariantSkuAlreadyExistsError);
  });

  it("should allow keeping its own sku", async () => {
    const created = await seed("V-1");

    const { variant } = await sut.execute({
      id: created.id,
      variant_sku: "V-1",
      quantity: 3,
    });

    expect(variant.variant_sku).toBe("V-1");
    expect(variant.quantity).toBe(3);
  });

  it("should allow changing to an unused sku", async () => {
    const created = await seed("V-1");

    const { variant } = await sut.execute({
      id: created.id,
      variant_sku: "V-9",
    });

    expect(variant.variant_sku).toBe("V-9");
  });
});
