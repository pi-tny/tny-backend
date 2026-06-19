import { hash } from "bcryptjs";
import type { Admin } from "../../../generated/prisma";
import type { AdminsRepository } from "@/repositories/admins-repository";
import { AdminAlreadyExistsError } from "@/use-cases/errors/admin-already-exists-error";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface UpdateAdminUseCaseRequest {
  id: number;
  name?: string;
  email?: string;
  password?: string;
  active?: boolean;
}

interface UpdateAdminUseCaseResponse {
  admin: Admin;
}

export class UpdateAdminUseCase {
  constructor(private adminsRepository: AdminsRepository) {}

  async execute({
    id,
    name,
    email,
    password,
    active,
  }: UpdateAdminUseCaseRequest): Promise<UpdateAdminUseCaseResponse> {
    if (email !== undefined) {
      const existing = await this.adminsRepository.findByEmail(email);
      if (existing && existing.id !== id) {
        throw new AdminAlreadyExistsError();
      }
    }

    const password_hash =
      password !== undefined ? await hash(password, 6) : undefined;

    const admin = await this.adminsRepository.update(id, {
      name,
      email,
      active,
      password_hash,
    });
    if (!admin) {
      throw new ResourceNotFoundError();
    }

    return { admin };
  }
}
