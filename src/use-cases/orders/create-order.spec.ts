import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryOrdersRepository } from "@/repositories/in-memory/in-memory-orders-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { CreateOrderUseCase } from "./create-order";

let ordersRepository: InMemoryOrdersRepository;
let sut: CreateOrderUseCase;

describe("Create Order Use Case", () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    sut = new CreateOrderUseCase(ordersRepository);
  });

  it("should freeze item details and resolve unit_price (variant own price)", async () => {
    ordersRepository.snapshots.set(1, {
      color: "Preto",
      size: "M",
      price: 80,
      product_name: "Camiseta",
      product_price: 100,
      product_promotional_price: null,
    });

    const { order } = await sut.execute({
      name: "Maria",
      phone: "+5585999999999",
      items: [{ variant_id: 1, quantity: 2 }],
    });

    expect(order.items[0].product_name).toBe("Camiseta");
    expect(order.items[0].color).toBe("Preto");
    expect(order.items[0].unit_price).toBe(80);
    expect(order.items[0].subtotal).toBe(160);
    expect(order.total).toBe(160);
    expect(order.status).toBe("new");
  });

  it("should let the product promotional price override the variant price", async () => {
    ordersRepository.snapshots.set(1, {
      color: "Preto",
      size: "M",
      price: 80,
      product_name: "Camiseta",
      product_price: 100,
      product_promotional_price: 60,
    });

    const { order } = await sut.execute({
      name: "Maria",
      phone: "x",
      items: [{ variant_id: 1, quantity: 1 }],
    });

    expect(order.items[0].unit_price).toBe(60);
  });

  it("should fall back to the product base price when nothing else is set", async () => {
    ordersRepository.snapshots.set(1, {
      color: "Preto",
      size: "M",
      price: null,
      product_name: "Camiseta",
      product_price: 100,
      product_promotional_price: null,
    });

    const { order } = await sut.execute({
      name: "Maria",
      phone: "x",
      items: [{ variant_id: 1, quantity: 1 }],
    });

    expect(order.items[0].unit_price).toBe(100);
  });

  it("should sum the total across multiple items", async () => {
    ordersRepository.snapshots.set(1, {
      color: "Preto",
      size: "M",
      price: 50,
      product_name: "A",
      product_price: 50,
      product_promotional_price: null,
    });
    ordersRepository.snapshots.set(2, {
      color: "Branco",
      size: "G",
      price: 30,
      product_name: "B",
      product_price: 30,
      product_promotional_price: null,
    });

    const { order } = await sut.execute({
      name: "Maria",
      phone: "x",
      items: [
        { variant_id: 1, quantity: 2 },
        { variant_id: 2, quantity: 1 },
      ],
    });

    expect(order.total).toBe(130);
  });

  it("should throw when a variant does not exist", async () => {
    await expect(() =>
      sut.execute({
        name: "Maria",
        phone: "x",
        items: [{ variant_id: 999, quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
