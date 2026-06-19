import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryVariantsRepository } from "@/repositories/in-memory/in-memory-variants-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { DeleteVariantUseCase } from "./delete-variant";

let variantsRepository: InMemoryVariantsRepository;
let sut: DeleteVariantUseCase;

describe("Delete Variant Use Case", () => {
  beforeEach(() => {
    variantsRepository = new InMemoryVariantsRepository();
    variantsRepository.products.push({
      id: 1,
      price: 100,
      promotional_price: null,
    });
    sut = new DeleteVariantUseCase(variantsRepository);
  });

  it("should delete a variant", async () => {
    const variant = await variantsRepository.create(1, {
      variant_sku: "V-1",
      color: "Preto",
      size: "M",
      quantity: 5,
    });

    await sut.execute({ id: variant!.id });

    expect(variantsRepository.items).toHaveLength(0);
  });

  it("should throw when the variant does not exist", async () => {
    await expect(() => sut.execute({ id: 999 })).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });
});
