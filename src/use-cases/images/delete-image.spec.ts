import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryImagesRepository } from "@/repositories/in-memory/in-memory-images-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { DeleteImageUseCase } from "./delete-image";

let imagesRepository: InMemoryImagesRepository;
let sut: DeleteImageUseCase;

describe("Delete Image Use Case", () => {
  beforeEach(() => {
    imagesRepository = new InMemoryImagesRepository();
    imagesRepository.products.push({ id: 1 });
    sut = new DeleteImageUseCase(imagesRepository);
  });

  it("should delete an image", async () => {
    const image = await imagesRepository.create(1, { url: "a.jpg" });

    await sut.execute({ id: image!.id });

    expect(imagesRepository.items).toHaveLength(0);
  });

  it("should throw when the image does not exist", async () => {
    await expect(() => sut.execute({ id: 999 })).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });
});
