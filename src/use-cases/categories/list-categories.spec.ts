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

    const { result } = await sut.execute();

    expect(result.items).toHaveLength(2);
    expect(result.items.map((c) => c.name)).toEqual(["Camisetas", "Calças"]);
    expect(result.total).toBe(2);
  });

  it("should return an empty list when there are no categories", async () => {
    const { result } = await sut.execute();

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("should paginate the results", async () => {
    for (let i = 1; i <= 25; i++) {
      await categoriesRepository.create({ name: `Cat ${i}`, description: null });
    }

    const { result } = await sut.execute({ page: 2, limit: 10 });

    expect(result.items).toHaveLength(10);
    expect(result.items[0].name).toBe("Cat 11");
    expect(result.total).toBe(25);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
  });
});
