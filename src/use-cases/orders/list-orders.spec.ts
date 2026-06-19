import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryOrdersRepository } from "@/repositories/in-memory/in-memory-orders-repository";
import { ListOrdersUseCase } from "./list-orders";

let ordersRepository: InMemoryOrdersRepository;
let sut: ListOrdersUseCase;

async function seed(status: string) {
  const order = await ordersRepository.create(
    { name: "x", phone: "x", total: 10 },
    [],
  );
  await ordersRepository.updateStatus(order.id, status);
}

describe("List Orders Use Case", () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    sut = new ListOrdersUseCase(ordersRepository);
  });

  it("should list all orders when no status filter is given", async () => {
    await seed("new");
    await seed("fulfilled");

    const { orders } = await sut.execute({});

    expect(orders).toHaveLength(2);
  });

  it("should filter by status", async () => {
    await seed("new");
    await seed("fulfilled");

    const { orders } = await sut.execute({ status: "fulfilled" });

    expect(orders).toHaveLength(1);
    expect(orders[0].status).toBe("fulfilled");
  });
});
