import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryAdminsRepository } from "@/repositories/in-memory/in-memory-admins-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { GetAdminProfileUseCase } from "./get-admin-profile";

let adminsRepository: InMemoryAdminsRepository;
let sut: GetAdminProfileUseCase;

function seedAdmin(overrides: { active?: boolean } = {}) {
  adminsRepository.items.push({
    id: 1,
    name: "Admin",
    email: "admin@tny.dev",
    password_hash: "hash",
    active: overrides.active ?? true,
    created_at: new Date(),
  });
}

describe("Get Admin Profile Use Case", () => {
  beforeEach(() => {
    adminsRepository = new InMemoryAdminsRepository();
    sut = new GetAdminProfileUseCase(adminsRepository);
  });

  it("should return the admin profile by id", async () => {
    seedAdmin();

    const { admin } = await sut.execute({ adminId: 1 });

    expect(admin.email).toBe("admin@tny.dev");
  });

  it("should throw when the admin does not exist", async () => {
    await expect(() =>
      sut.execute({ adminId: 999 }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("should throw when the admin is inactive", async () => {
    seedAdmin({ active: false });

    await expect(() =>
      sut.execute({ adminId: 1 }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
