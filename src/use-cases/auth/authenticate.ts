import { compare } from "bcryptjs";
import type { Admin } from "../../../generated/prisma";
import type { AdminsRepository } from "@/repositories/admins-repository";
import { InvalidCredentialsError } from "@/use-cases/errors/invalid-credentials-error";
import { AccountLockedError } from "@/use-cases/errors/account-locked-error";

// Bloqueio após tentativas falhas consecutivas (RNF003).
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos

interface AuthenticateUseCaseRequest {
  email: string;
  password: string;
}

interface AuthenticateUseCaseResponse {
  admin: Admin;
}

export class AuthenticateUseCase {
  constructor(private adminsRepository: AdminsRepository) {}

  async execute({
    email,
    password,
  }: AuthenticateUseCaseRequest): Promise<AuthenticateUseCaseResponse> {
    const admin = await this.adminsRepository.findByEmail(email);

    if (!admin || !admin.active) {
      throw new InvalidCredentialsError();
    }

    // Conta ainda bloqueada.
    if (admin.locked_until && admin.locked_until.getTime() > Date.now()) {
      throw new AccountLockedError();
    }

    const passwordMatches = await compare(password, admin.password_hash);

    if (!passwordMatches) {
      const attempts = admin.failed_login_attempts + 1;
      const shouldLock = attempts >= MAX_LOGIN_ATTEMPTS;
      const locked_until = shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : null;
      await this.adminsRepository.updateLoginState(admin.id, {
        failed_login_attempts: attempts,
        locked_until,
      });
      throw shouldLock ? new AccountLockedError() : new InvalidCredentialsError();
    }

    // Sucesso: zera o contador se necessário.
    if (admin.failed_login_attempts > 0 || admin.locked_until) {
      await this.adminsRepository.updateLoginState(admin.id, {
        failed_login_attempts: 0,
        locked_until: null,
      });
    }

    return { admin };
  }
}
