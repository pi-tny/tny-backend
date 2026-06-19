import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLeadsRepository } from "@/repositories/in-memory/in-memory-leads-repository";
import { ListLeadsUseCase } from "./list-leads";

let leadsRepository: InMemoryLeadsRepository;
let sut: ListLeadsUseCase;

describe("List Leads Use Case", () => {
  beforeEach(() => {
    leadsRepository = new InMemoryLeadsRepository();
    sut = new ListLeadsUseCase(leadsRepository);
  });

  it("should list leads with pagination", async () => {
    await leadsRepository.upsertByEmail({ name: "A", email: "a@x.com", phone: "1" });
    await leadsRepository.upsertByEmail({ name: "B", email: "b@x.com", phone: "2" });

    const { result } = await sut.execute({ page: 1, limit: 1 });

    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(1);
  });

  it("should search by name or email", async () => {
    await leadsRepository.upsertByEmail({
      name: "Maria",
      email: "maria@x.com",
      phone: "1",
    });
    await leadsRepository.upsertByEmail({ name: "Joao", email: "joao@x.com", phone: "2" });

    const { result } = await sut.execute({ q: "maria" });

    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe("Maria");
  });
});
