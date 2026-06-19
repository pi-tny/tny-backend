import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryProductsRepository } from "@/repositories/in-memory/in-memory-products-repository";
import { ProductSkuAlreadyExistsError } from "@/use-cases/errors/product-sku-already-exists-error";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { UpdateProductUseCase } from "./update-product";

let productsRepository: InMemoryProductsRepository;
let sut: UpdateProductUseCase;

async function seed(sku: string) {
  return productsRepository.create({
    sku,
    name: "Name",
    description: "desc",
    price: 10,
  });
}

describe("Update Product Use Case", () => {
  beforeEach(() => {
    productsRepository = new InMemoryProductsRepository();
    sut = new UpdateProductUseCase(productsRepository);
  });

  it("should update fields of a product", async () => {
    const created = await seed("SKU-1");

    const { product } = await sut.execute({
      id: created.id,
      name: "Updated",
      promotional_price: 8,
    });

    expect(product.name).toBe("Updated");
    expect(product.promotional_price).toBe(8);
  });

  it("should throw when the product does not exist", async () => {
    await expect(() =>
      sut.execute({ id: 999, name: "X" }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("should allow keeping its own sku", async () => {
    const created = await seed("SKU-1");

    const { product } = await sut.execute({ id: created.id, sku: "SKU-1" });

    expect(product.sku).toBe("SKU-1");
  });

  it("should reject changing to a sku used by another product", async () => {
    await seed("SKU-1");
    const second = await seed("SKU-2");

    await expect(() =>
      sut.execute({ id: second.id, sku: "SKU-1" }),
    ).rejects.toBeInstanceOf(ProductSkuAlreadyExistsError);
  });
});
