import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryOrdersRepository } from "@/repositories/in-memory/in-memory-orders-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { UpdateOrderStatusUseCase } from "./update-order-status";

let ordersRepository: InMemoryOrdersRepository;
let sut: UpdateOrderStatusUseCase;

describe("Update Order Status Use Case", () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    sut = new UpdateOrderStatusUseCase(ordersRepository);
  });

  it("should update the order status", async () => {
    const created = await ordersRepository.create(
      { name: "Maria", phone: "x", total: 10 },
      [],
    );

    const { order } = await sut.execute({
      id: created.id,
      status: "fulfilled",
    });

    expect(order.status).toBe("fulfilled");
  });

  it("should throw when the order does not exist", async () => {
    await expect(() =>
      sut.execute({ id: 999, status: "fulfilled" }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
