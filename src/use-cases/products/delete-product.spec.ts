import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryProductsRepository } from "@/repositories/in-memory/in-memory-products-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { DeleteProductUseCase } from "./delete-product";

let productsRepository: InMemoryProductsRepository;
let sut: DeleteProductUseCase;

describe("Delete Product Use Case", () => {
  beforeEach(() => {
    productsRepository = new InMemoryProductsRepository();
    sut = new DeleteProductUseCase(productsRepository);
  });

  it("should soft delete a product (active=false)", async () => {
    const product = await productsRepository.create({
      sku: "SKU-1",
      name: "A",
      description: "x",
      price: 10,
    });

    await sut.execute({ id: product.id });

    expect(productsRepository.items[0].active).toBe(false);
  });

  it("should throw when the product does not exist", async () => {
    await expect(() => sut.execute({ id: 999 })).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });
});
