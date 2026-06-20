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

  it("should filter by a price range (base price)", async () => {
    await productsRepository.create({ sku: "a", name: "Cheap", description: "x", price: 10 });
    await productsRepository.create({ sku: "b", name: "Mid", description: "x", price: 50 });
    await productsRepository.create({ sku: "c", name: "Pricey", description: "x", price: 100 });

    const { result } = await sut.execute({ minPrice: 20, maxPrice: 80 });

    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe("Mid");
  });

  it("should filter on_sale products only", async () => {
    await productsRepository.create({ sku: "a", name: "Full", description: "x", price: 50 });
    await productsRepository.create({
      sku: "b",
      name: "Promo",
      description: "x",
      price: 50,
      promotional_price: 30,
    });

    const { result } = await sut.execute({ onSale: true });

    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe("Promo");
  });

  it("should filter in_stock products only", async () => {
    const withStock = await productsRepository.create({ sku: "a", name: "InStock", description: "x", price: 10 });
    await productsRepository.create({ sku: "b", name: "OutOfStock", description: "x", price: 10 });
    productsRepository.variants.push({ product_id: withStock.id, quantity: 5 });

    const { result } = await sut.execute({ inStock: true });

    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe("InStock");
  });

  it("should sort by price ascending and descending", async () => {
    await productsRepository.create({ sku: "a", name: "B", description: "x", price: 30 });
    await productsRepository.create({ sku: "b", name: "A", description: "x", price: 10 });
    await productsRepository.create({ sku: "c", name: "C", description: "x", price: 20 });

    const asc = await sut.execute({ sort: "price_asc" });
    expect(asc.result.items.map((p) => p.price)).toEqual([10, 20, 30]);

    const desc = await sut.execute({ sort: "price_desc" });
    expect(desc.result.items.map((p) => p.price)).toEqual([30, 20, 10]);
  });

  it("should default to newest first (id desc)", async () => {
    const first = await seed("First");
    const second = await seed("Second");

    const { result } = await sut.execute({});

    expect(result.items.map((p) => p.id)).toEqual([second.id, first.id]);
  });

  it("should sort by name", async () => {
    await seed("Banana");
    await seed("Abacaxi");

    const { result } = await sut.execute({ sort: "name" });

    expect(result.items.map((p) => p.name)).toEqual(["Abacaxi", "Banana"]);
  });
});
