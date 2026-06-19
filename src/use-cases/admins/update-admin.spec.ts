import { beforeEach, describe, expect, it } from "vitest";
import { compare } from "bcryptjs";
import { InMemoryAdminsRepository } from "@/repositories/in-memory/in-memory-admins-repository";
import { AdminAlreadyExistsError } from "@/use-cases/errors/admin-already-exists-error";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { UpdateAdminUseCase } from "./update-admin";

let adminsRepository: InMemoryAdminsRepository;
let sut: UpdateAdminUseCase;

async function seed(email: string) {
  return adminsRepository.create({
    name: "Admin",
    email,
    password_hash: "hash",
  });
}

describe("Update Admin Use Case", () => {
  beforeEach(() => {
    adminsRepository = new InMemoryAdminsRepository();
    sut = new UpdateAdminUseCase(adminsRepository);
  });

  it("should update name and rehash a new password", async () => {
    const admin = await seed("admin@tny.dev");

    const { admin: updated } = await sut.execute({
      id: admin.id,
      name: "New Name",
      password: "newpass123",
    });

    expect(updated.name).toBe("New Name");
    expect(await compare("newpass123", updated.password_hash)).toBe(true);
  });

  it("should throw when the admin does not exist", async () => {
    await expect(() =>
      sut.execute({ id: 999, name: "X" }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("should reject changing to an email used by another admin", async () => {
    await seed("first@tny.dev");
    const second = await seed("second@tny.dev");

    await expect(() =>
      sut.execute({ id: second.id, email: "first@tny.dev" }),
    ).rejects.toBeInstanceOf(AdminAlreadyExistsError);
  });
});
