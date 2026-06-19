import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryProductsRepository } from "@/repositories/in-memory/in-memory-products-repository";
import { ProductSkuAlreadyExistsError } from "@/use-cases/errors/product-sku-already-exists-error";
import { CreateProductUseCase } from "./create-product";

let productsRepository: InMemoryProductsRepository;
let sut: CreateProductUseCase;

describe("Create Product Use Case", () => {
  beforeEach(() => {
    productsRepository = new InMemoryProductsRepository();
    sut = new CreateProductUseCase(productsRepository);
  });

  it("should create a product", async () => {
    const { product } = await sut.execute({
      sku: "SKU-1",
      name: "Camiseta",
      description: "100% algodão",
      price: 89.9,
    });

    expect(product.id).toEqual(expect.any(Number));
    expect(product.active).toBe(true);
    expect(product.promotional_price).toBeNull();
    expect(productsRepository.items).toHaveLength(1);
  });

  it("should link categories on creation", async () => {
    productsRepository.categories.push(
      { id: 1, name: "Camisetas", description: null },
      { id: 2, name: "Novidades", description: null },
    );

    const { product } = await sut.execute({
      sku: "SKU-2",
      name: "Regata",
      description: "x",
      price: 50,
      category_ids: [1, 2],
    });

    expect(product.categories).toHaveLength(2);
  });

  it("should not create two products with the same sku", async () => {
    await sut.execute({ sku: "SKU-3", name: "A", description: "x", price: 10 });

    await expect(() =>
      sut.execute({ sku: "SKU-3", name: "B", description: "y", price: 20 }),
    ).rejects.toBeInstanceOf(ProductSkuAlreadyExistsError);
  });
});
