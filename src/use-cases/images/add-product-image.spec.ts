import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryImagesRepository } from "@/repositories/in-memory/in-memory-images-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { AddProductImageUseCase } from "./add-product-image";

let imagesRepository: InMemoryImagesRepository;
let sut: AddProductImageUseCase;

describe("Add Product Image Use Case", () => {
  beforeEach(() => {
    imagesRepository = new InMemoryImagesRepository();
    imagesRepository.products.push({ id: 1 });
    imagesRepository.variants.push({ id: 10, product_id: 1 });
    sut = new AddProductImageUseCase(imagesRepository);
  });

  it("should add a general product image", async () => {
    const { image } = await sut.execute({ productId: 1, url: "a.jpg" });

    expect(image.id).toEqual(expect.any(Number));
    expect(image.variant_id).toBeNull();
    expect(image.position).toBe(0);
  });

  it("should add a variant-scoped image", async () => {
    const { image } = await sut.execute({
      productId: 1,
      url: "v.jpg",
      variant_id: 10,
    });

    expect(image.variant_id).toBe(10);
  });

  it("should throw when the product does not exist", async () => {
    await expect(() =>
      sut.execute({ productId: 999, url: "a.jpg" }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("should throw when the variant does not belong to the product", async () => {
    imagesRepository.products.push({ id: 2 });

    await expect(() =>
      sut.execute({ productId: 2, url: "a.jpg", variant_id: 10 }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
