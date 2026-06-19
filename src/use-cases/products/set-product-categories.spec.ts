import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryProductsRepository } from "@/repositories/in-memory/in-memory-products-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { SetProductCategoriesUseCase } from "./set-product-categories";

let productsRepository: InMemoryProductsRepository;
let sut: SetProductCategoriesUseCase;

describe("Set Product Categories Use Case", () => {
  beforeEach(() => {
    productsRepository = new InMemoryProductsRepository();
    sut = new SetProductCategoriesUseCase(productsRepository);
  });

  it("should replace the product category set", async () => {
    productsRepository.categories.push(
      { id: 1, name: "A", description: null },
      { id: 2, name: "B", description: null },
    );
    const product = await productsRepository.create({
      sku: "SKU-1",
      name: "P",
      description: "x",
      price: 10,
      category_ids: [1],
    });

    const { categories } = await sut.execute({
      id: product.id,
      categoryIds: [2],
    });

    expect(categories.map((c) => c.id)).toEqual([2]);
  });

  it("should throw when the product does not exist", async () => {
    await expect(() =>
      sut.execute({ id: 999, categoryIds: [1] }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
