import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryProductsRepository } from "@/repositories/in-memory/in-memory-products-repository";
import { ListProductsUseCase } from "./list-products";

let productsRepository: InMemoryProductsRepository;
let sut: ListProductsUseCase;

async function seed(name: string, active = true) {
  return productsRepository.create({
    sku: name,
    name,
    description: "x",
    price: 10,
    active,
  });
}

describe("List Products Use Case", () => {
  beforeEach(() => {
    productsRepository = new InMemoryProductsRepository();
    sut = new ListProductsUseCase(productsRepository);
  });

  it("should filter only active products when active=true (public)", async () => {
    await seed("Active");
    await seed("Hidden", false);

    const { result } = await sut.execute({ active: true });

    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe("Active");
  });

  it("should return all products when no active filter (admin)", async () => {
    await seed("Active");
    await seed("Hidden", false);

    const { result } = await sut.execute({});

    expect(result.total).toBe(2);
  });

  it("should search by name and paginate", async () => {
    await seed("Camiseta Preta");
    await seed("Camiseta Branca");
    await seed("Calça Jeans");

    const { result } = await sut.execute({ q: "camiseta", page: 1, limit: 1 });

    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(1);
    expect(result.page).toBe(1);
  });
});
