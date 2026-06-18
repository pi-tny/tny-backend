import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryCategoriesRepository } from "@/repositories/in-memory/in-memory-categories-repository";
import { ListCategoriesUseCase } from "./list-categories";

let categoriesRepository: InMemoryCategoriesRepository;
let sut: ListCategoriesUseCase;

describe("List Categories Use Case", () => {
  beforeEach(() => {
    categoriesRepository = new InMemoryCategoriesRepository();
    sut = new ListCategoriesUseCase(categoriesRepository);
  });

  it("should be able to list all categories", async () => {
    await categoriesRepository.create({ name: "Camisetas", description: null });
    await categoriesRepository.create({ name: "Calças", description: null });

    const { categories } = await sut.execute();

    expect(categories).toHaveLength(2);
    expect(categories.map((c) => c.name)).toEqual(["Camisetas", "Calças"]);
  });

  it("should return an empty list when there are no categories", async () => {
    const { categories } = await sut.execute();

    expect(categories).toEqual([]);
  });
});
