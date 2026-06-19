import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLeadsRepository } from "@/repositories/in-memory/in-memory-leads-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { DeleteLeadUseCase } from "./delete-lead";

let leadsRepository: InMemoryLeadsRepository;
let sut: DeleteLeadUseCase;

describe("Delete Lead Use Case", () => {
  beforeEach(() => {
    leadsRepository = new InMemoryLeadsRepository();
    sut = new DeleteLeadUseCase(leadsRepository);
  });

  it("should delete a lead", async () => {
    const lead = await leadsRepository.upsertByEmail({
      name: "A",
      email: "a@x.com",
      phone: "1",
    });

    await sut.execute({ id: lead.id });

    expect(leadsRepository.items).toHaveLength(0);
  });

  it("should throw when the lead does not exist", async () => {
    await expect(() => sut.execute({ id: 999 })).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });
});
