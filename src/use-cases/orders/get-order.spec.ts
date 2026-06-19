import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryOrdersRepository } from "@/repositories/in-memory/in-memory-orders-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { GetOrderUseCase } from "./get-order";

let ordersRepository: InMemoryOrdersRepository;
let sut: GetOrderUseCase;

describe("Get Order Use Case", () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    sut = new GetOrderUseCase(ordersRepository);
  });

  it("should return an order by id", async () => {
    const created = await ordersRepository.create(
      { name: "Maria", phone: "x", total: 10 },
      [],
    );

    const { order } = await sut.execute({ id: created.id });

    expect(order.name).toBe("Maria");
  });

  it("should throw when the order does not exist", async () => {
    await expect(() => sut.execute({ id: 999 })).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });
});
