import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryCategoriesRepository } from "@/repositories/in-memory/in-memory-categories-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { DeleteCategoryUseCase } from "./delete-category";

let categoriesRepository: InMemoryCategoriesRepository;
let sut: DeleteCategoryUseCase;

describe("Delete Category Use Case", () => {
  beforeEach(() => {
    categoriesRepository = new InMemoryCategoriesRepository();
    sut = new DeleteCategoryUseCase(categoriesRepository);
  });

  it("should be able to delete a category", async () => {
    const created = await categoriesRepository.create({
      name: "Acessórios",
      description: null,
    });

    await sut.execute({ id: created.id });

    expect(categoriesRepository.items).toHaveLength(0);
  });

  it("should throw when deleting a category that does not exist", async () => {
    await expect(() => sut.execute({ id: 999 })).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });
});
