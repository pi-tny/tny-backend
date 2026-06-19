import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryProductsRepository } from "@/repositories/in-memory/in-memory-products-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { GetRelatedProductsUseCase } from "./get-related-products";

let productsRepository: InMemoryProductsRepository;
let sut: GetRelatedProductsUseCase;

describe("Get Related Products Use Case", () => {
  beforeEach(() => {
    productsRepository = new InMemoryProductsRepository();
    sut = new GetRelatedProductsUseCase(productsRepository);
  });

  it("should throw when the base product does not exist", async () => {
    await expect(() => sut.execute({ id: 999 })).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });

  it("should return active products sharing a category, excluding itself", async () => {
    productsRepository.categories.push({
      id: 1,
      name: "Camisetas",
      description: null,
    });

    const base = await productsRepository.create({
      sku: "A",
      name: "Base",
      description: "x",
      price: 10,
      category_ids: [1],
    });
    const related = await productsRepository.create({
      sku: "B",
      name: "Related",
      description: "x",
      price: 10,
      category_ids: [1],
    });
    // inactive sibling must be excluded
    await productsRepository.create({
      sku: "C",
      name: "Inactive",
      description: "x",
      price: 10,
      active: false,
      category_ids: [1],
    });

    const { products } = await sut.execute({ id: base.id });

    expect(products.map((p) => p.id)).toEqual([related.id]);
  });
});
