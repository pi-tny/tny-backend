import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryImagesRepository } from "@/repositories/in-memory/in-memory-images-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { UpdateImageUseCase } from "./update-image";

let imagesRepository: InMemoryImagesRepository;
let sut: UpdateImageUseCase;

describe("Update Image Use Case", () => {
  beforeEach(() => {
    imagesRepository = new InMemoryImagesRepository();
    imagesRepository.products.push({ id: 1 });
    sut = new UpdateImageUseCase(imagesRepository);
  });

  it("should update image metadata", async () => {
    const image = await imagesRepository.create(1, { url: "a.jpg" });

    const { image: updated } = await sut.execute({
      id: image!.id,
      alt_text: "Frente",
      position: 3,
    });

    expect(updated.alt_text).toBe("Frente");
    expect(updated.position).toBe(3);
  });

  it("should throw when the image does not exist", async () => {
    await expect(() =>
      sut.execute({ id: 999, position: 1 }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
