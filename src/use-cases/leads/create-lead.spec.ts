import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLeadsRepository } from "@/repositories/in-memory/in-memory-leads-repository";
import { CreateLeadUseCase } from "./create-lead";

let leadsRepository: InMemoryLeadsRepository;
let sut: CreateLeadUseCase;

describe("Create Lead Use Case", () => {
  beforeEach(() => {
    leadsRepository = new InMemoryLeadsRepository();
    sut = new CreateLeadUseCase(leadsRepository);
  });

  it("should create a lead with consent defaulting to true", async () => {
    const { lead } = await sut.execute({
      name: "Maria",
      email: "maria@example.com",
      phone: "x",
    });

    expect(lead.id).toEqual(expect.any(Number));
    expect(lead.marketing_consent).toBe(true);
  });

  it("should upsert by email instead of duplicating", async () => {
    await sut.execute({ name: "Maria", email: "maria@example.com", phone: "1" });
    const { lead } = await sut.execute({
      name: "Maria Silva",
      email: "maria@example.com",
      phone: "2",
    });

    expect(leadsRepository.items).toHaveLength(1);
    expect(lead.name).toBe("Maria Silva");
    expect(lead.phone).toBe("2");
  });
});
