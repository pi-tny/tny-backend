import { beforeEach, describe, expect, it } from "vitest";
import { hash } from "bcryptjs";
import { InMemoryAdminsRepository } from "@/repositories/in-memory/in-memory-admins-repository";
import { InvalidCredentialsError } from "@/use-cases/errors/invalid-credentials-error";
import { AuthenticateUseCase } from "./authenticate";

let adminsRepository: InMemoryAdminsRepository;
let sut: AuthenticateUseCase;

async function seedAdmin(overrides: { active?: boolean } = {}) {
  adminsRepository.items.push({
    id: 1,
    name: "Admin",
    email: "admin@tny.dev",
    password_hash: await hash("password123", 6),
    active: overrides.active ?? true,
    created_at: new Date(),
  });
}

describe("Authenticate Use Case", () => {
  beforeEach(() => {
    adminsRepository = new InMemoryAdminsRepository();
    sut = new AuthenticateUseCase(adminsRepository);
  });

  it("should authenticate with valid credentials", async () => {
    await seedAdmin();

    const { admin } = await sut.execute({
      email: "admin@tny.dev",
      password: "password123",
    });

    expect(admin.id).toBe(1);
  });

  it("should not authenticate with a wrong password", async () => {
    await seedAdmin();

    await expect(() =>
      sut.execute({ email: "admin@tny.dev", password: "wrong-password" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("should not authenticate with a non-existent email", async () => {
    await expect(() =>
      sut.execute({ email: "ghost@tny.dev", password: "password123" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("should not authenticate an inactive admin", async () => {
    await seedAdmin({ active: false });

    await expect(() =>
      sut.execute({ email: "admin@tny.dev", password: "password123" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
