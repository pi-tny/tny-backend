import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryOrdersRepository } from "@/repositories/in-memory/in-memory-orders-repository";
import { ListOrdersUseCase } from "./list-orders";

let ordersRepository: InMemoryOrdersRepository;
let sut: ListOrdersUseCase;

async function seed(status: string, createdAt?: Date) {
  const order = await ordersRepository.create(
    { name: "x", phone: "x", total: 10 },
    [],
  );
  if (status !== "new") await ordersRepository.updateStatus(order.id, status);
  if (createdAt) {
    const stored = ordersRepository.items.find((o) => o.id === order.id)!;
    stored.created_at = createdAt;
  }
  return order;
}

describe("List Orders Use Case", () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    sut = new ListOrdersUseCase(ordersRepository);
  });

  it("should list all orders when no filter is given", async () => {
    await seed("new");
    await seed("fulfilled");

    const { result } = await sut.execute({});

    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
  });

  it("should filter by status", async () => {
    await seed("new");
    await seed("fulfilled");

    const { result } = await sut.execute({ status: "fulfilled" });

    expect(result.total).toBe(1);
    expect(result.items[0].status).toBe("fulfilled");
  });

  it("should paginate", async () => {
    await seed("new");
    await seed("new");
    await seed("new");

    const { result } = await sut.execute({ page: 1, limit: 2 });

    expect(result.total).toBe(3);
    expect(result.items).toHaveLength(2);
    expect(result.page).toBe(1);
  });

  it("should filter by date range (date_to inclusive of the whole day)", async () => {
    await seed("new", new Date("2026-06-10T12:00:00Z"));
    await seed("new", new Date("2026-06-15T23:30:00Z"));
    await seed("new", new Date("2026-06-20T08:00:00Z"));

    const { result } = await sut.execute({
      dateFrom: new Date("2026-06-15"),
      dateTo: new Date("2026-06-15"),
    });

    expect(result.total).toBe(1);
  });
});
