import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryCategoriesRepository } from "@/repositories/in-memory/in-memory-categories-repository";
import { CreateCategoryUseCase } from "./create-category";

let categoriesRepository: InMemoryCategoriesRepository;
let sut: CreateCategoryUseCase;

describe("Create Category Use Case", () => {
  beforeEach(() => {
    categoriesRepository = new InMemoryCategoriesRepository();
    sut = new CreateCategoryUseCase(categoriesRepository);
  });

  it("should be able to create a category", async () => {
    const { category } = await sut.execute({
      name: "Lançamentos",
      description: "Novidades",
    });

    expect(category.id).toEqual(expect.any(Number));
    expect(category.name).toBe("Lançamentos");
    expect(category.description).toBe("Novidades");
    expect(categoriesRepository.items).toHaveLength(1);
  });

  it("should default description to null when omitted", async () => {
    const { category } = await sut.execute({ name: "Bermudas" });

    expect(category.description).toBeNull();
  });
});
