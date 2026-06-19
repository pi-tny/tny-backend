import { beforeEach, describe, expect, it } from "vitest";
import { compare } from "bcryptjs";
import { InMemoryAdminsRepository } from "@/repositories/in-memory/in-memory-admins-repository";
import { AdminAlreadyExistsError } from "@/use-cases/errors/admin-already-exists-error";
import { CreateAdminUseCase } from "./create-admin";

let adminsRepository: InMemoryAdminsRepository;
let sut: CreateAdminUseCase;

describe("Create Admin Use Case", () => {
  beforeEach(() => {
    adminsRepository = new InMemoryAdminsRepository();
    sut = new CreateAdminUseCase(adminsRepository);
  });

  it("should create an admin and hash the password", async () => {
    const { admin } = await sut.execute({
      name: "Admin",
      email: "admin@tny.dev",
      password: "password123",
    });

    expect(admin.id).toEqual(expect.any(Number));
    expect(admin.password_hash).not.toBe("password123");
    expect(await compare("password123", admin.password_hash)).toBe(true);
  });

  it("should not create two admins with the same email", async () => {
    await sut.execute({
      name: "Admin",
      email: "admin@tny.dev",
      password: "password123",
    });

    await expect(() =>
      sut.execute({
        name: "Other",
        email: "admin@tny.dev",
        password: "password123",
      }),
    ).rejects.toBeInstanceOf(AdminAlreadyExistsError);
  });
});
