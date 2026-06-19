import { compare } from "bcryptjs";
import type { Admin } from "../../../generated/prisma";
import type { AdminsRepository } from "@/repositories/admins-repository";
import { InvalidCredentialsError } from "@/use-cases/errors/invalid-credentials-error";

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

    const passwordMatches = await compare(password, admin.password_hash);

    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    return { admin };
  }
}
