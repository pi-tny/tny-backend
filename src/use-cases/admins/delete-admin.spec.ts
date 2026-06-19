import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryAdminsRepository } from "@/repositories/in-memory/in-memory-admins-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { DeleteAdminUseCase } from "./delete-admin";

let adminsRepository: InMemoryAdminsRepository;
let sut: DeleteAdminUseCase;

describe("Delete Admin Use Case", () => {
  beforeEach(() => {
    adminsRepository = new InMemoryAdminsRepository();
    sut = new DeleteAdminUseCase(adminsRepository);
  });

  it("should delete an admin", async () => {
    const admin = await adminsRepository.create({
      name: "Admin",
      email: "admin@tny.dev",
      password_hash: "hash",
    });

    await sut.execute({ id: admin.id });

    expect(adminsRepository.items).toHaveLength(0);
  });

  it("should throw when the admin does not exist", async () => {
    await expect(() => sut.execute({ id: 999 })).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });
});
