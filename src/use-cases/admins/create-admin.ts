import { hash } from "bcryptjs";
import type { Admin } from "../../../generated/prisma";
import type { AdminsRepository } from "@/repositories/admins-repository";
import { AdminAlreadyExistsError } from "@/use-cases/errors/admin-already-exists-error";

interface CreateAdminUseCaseRequest {
  name: string;
  email: string;
  password: string;
}

interface CreateAdminUseCaseResponse {
  admin: Admin;
}

export class CreateAdminUseCase {
  constructor(private adminsRepository: AdminsRepository) {}

  async execute({
    name,
    email,
    password,
  }: CreateAdminUseCaseRequest): Promise<CreateAdminUseCaseResponse> {
    const existing = await this.adminsRepository.findByEmail(email);
    if (existing) {
      throw new AdminAlreadyExistsError();
    }

    const password_hash = await hash(password, 6);
    const admin = await this.adminsRepository.create({
      name,
      email,
      password_hash,
    });

    return { admin };
  }
}
