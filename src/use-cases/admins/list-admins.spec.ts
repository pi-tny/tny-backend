import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryAdminsRepository } from "@/repositories/in-memory/in-memory-admins-repository";
import { ListAdminsUseCase } from "./list-admins";

let adminsRepository: InMemoryAdminsRepository;
let sut: ListAdminsUseCase;

describe("List Admins Use Case", () => {
  beforeEach(() => {
    adminsRepository = new InMemoryAdminsRepository();
    sut = new ListAdminsUseCase(adminsRepository);
  });

  it("should list all admins", async () => {
    await adminsRepository.create({
      name: "A",
      email: "a@tny.dev",
      password_hash: "h",
    });
    await adminsRepository.create({
      name: "B",
      email: "b@tny.dev",
      password_hash: "h",
    });

    const { admins } = await sut.execute();

    expect(admins).toHaveLength(2);
  });
});
