import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryCategoriesRepository } from "@/repositories/in-memory/in-memory-categories-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { GetCategoryUseCase } from "./get-category";

let categoriesRepository: InMemoryCategoriesRepository;
let sut: GetCategoryUseCase;

describe("Get Category Use Case", () => {
  beforeEach(() => {
    categoriesRepository = new InMemoryCategoriesRepository();
    sut = new GetCategoryUseCase(categoriesRepository);
  });

  it("should be able to get a category by id", async () => {
    const created = await categoriesRepository.create({
      name: "Acessórios",
      description: "Itens diversos",
    });

    const { category } = await sut.execute({ id: created.id });

    expect(category.id).toBe(created.id);
    expect(category.name).toBe("Acessórios");
  });

  it("should throw when the category does not exist", async () => {
    await expect(() => sut.execute({ id: 999 })).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });
});
