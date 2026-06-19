import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryProductsRepository } from "@/repositories/in-memory/in-memory-products-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { GetProductUseCase } from "./get-product";

let productsRepository: InMemoryProductsRepository;
let sut: GetProductUseCase;

describe("Get Product Use Case", () => {
  beforeEach(() => {
    productsRepository = new InMemoryProductsRepository();
    sut = new GetProductUseCase(productsRepository);
  });

  it("should return an active product detail", async () => {
    const created = await productsRepository.create({
      sku: "SKU-1",
      name: "A",
      description: "x",
      price: 10,
    });

    const { product } = await sut.execute({ id: created.id });

    expect(product.id).toBe(created.id);
    expect(product.variants).toEqual([]);
  });

  it("should hide inactive products from the public view", async () => {
    const created = await productsRepository.create({
      sku: "SKU-1",
      name: "A",
      description: "x",
      price: 10,
      active: false,
    });

    await expect(() =>
      sut.execute({ id: created.id }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("should expose inactive products when includeInactive is set (admin)", async () => {
    const created = await productsRepository.create({
      sku: "SKU-1",
      name: "A",
      description: "x",
      price: 10,
      active: false,
    });

    const { product } = await sut.execute({
      id: created.id,
      includeInactive: true,
    });

    expect(product.active).toBe(false);
  });
});
