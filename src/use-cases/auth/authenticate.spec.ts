import { beforeEach, describe, expect, it } from "vitest";
import { hash } from "bcryptjs";
import { InMemoryAdminsRepository } from "@/repositories/in-memory/in-memory-admins-repository";
import { InvalidCredentialsError } from "@/use-cases/errors/invalid-credentials-error";
import { AccountLockedError } from "@/use-cases/errors/account-locked-error";
import { AuthenticateUseCase, MAX_LOGIN_ATTEMPTS } from "./authenticate";

let adminsRepository: InMemoryAdminsRepository;
let sut: AuthenticateUseCase;

async function seedAdmin(
  overrides: { active?: boolean; failed_login_attempts?: number; locked_until?: Date | null } = {},
) {
  adminsRepository.items.push({
    id: 1,
    name: "Admin",
    email: "admin@tny.dev",
    password_hash: await hash("password123", 6),
    active: overrides.active ?? true,
    failed_login_attempts: overrides.failed_login_attempts ?? 0,
    locked_until: overrides.locked_until ?? null,
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

  it("should lock the account after too many failed attempts", async () => {
    await seedAdmin();

    // the first (max-1) failures are still InvalidCredentials.
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS - 1; i++) {
      await expect(() =>
        sut.execute({ email: "admin@tny.dev", password: "wrong-password" }),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    }

    // the failure that hits the limit locks the account.
    await expect(() =>
      sut.execute({ email: "admin@tny.dev", password: "wrong-password" }),
    ).rejects.toBeInstanceOf(AccountLockedError);

    // even with the correct password, it stays locked.
    await expect(() =>
      sut.execute({ email: "admin@tny.dev", password: "password123" }),
    ).rejects.toBeInstanceOf(AccountLockedError);
  });

  it("should reject while locked_until is in the future", async () => {
    await seedAdmin({ locked_until: new Date(Date.now() + 60_000) });

    await expect(() =>
      sut.execute({ email: "admin@tny.dev", password: "password123" }),
    ).rejects.toBeInstanceOf(AccountLockedError);
  });

  it("should reset the failed counter on a successful login", async () => {
    await seedAdmin({ failed_login_attempts: 3 });

    await sut.execute({ email: "admin@tny.dev", password: "password123" });

    expect(adminsRepository.items[0].failed_login_attempts).toBe(0);
    expect(adminsRepository.items[0].locked_until).toBeNull();
  });

  it("should allow login again once the lock has expired", async () => {
    await seedAdmin({ locked_until: new Date(Date.now() - 1000), failed_login_attempts: 5 });

    const { admin } = await sut.execute({ email: "admin@tny.dev", password: "password123" });

    expect(admin.id).toBe(1);
    expect(adminsRepository.items[0].failed_login_attempts).toBe(0);
  });
});
