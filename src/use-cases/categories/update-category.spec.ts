import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryCategoriesRepository } from "@/repositories/in-memory/in-memory-categories-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { UpdateCategoryUseCase } from "./update-category";

let categoriesRepository: InMemoryCategoriesRepository;
let sut: UpdateCategoryUseCase;

describe("Update Category Use Case", () => {
  beforeEach(() => {
    categoriesRepository = new InMemoryCategoriesRepository();
    sut = new UpdateCategoryUseCase(categoriesRepository);
  });

  it("should be able to update a category", async () => {
    const created = await categoriesRepository.create({
      name: "Calsas",
      description: null,
    });

    const { category } = await sut.execute({
      id: created.id,
      name: "Calças",
      description: "Corrigido",
    });

    expect(category.name).toBe("Calças");
    expect(category.description).toBe("Corrigido");
  });

  it("should throw when updating a category that does not exist", async () => {
    await expect(() =>
      sut.execute({ id: 999, name: "X", description: null }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
