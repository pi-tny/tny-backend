import type { Admin } from "../../../generated/prisma";
import type { AdminsRepository } from "@/repositories/admins-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface GetAdminProfileUseCaseRequest {
  adminId: number;
}

interface GetAdminProfileUseCaseResponse {
  admin: Admin;
}

export class GetAdminProfileUseCase {
  constructor(private adminsRepository: AdminsRepository) {}

  async execute({
    adminId,
  }: GetAdminProfileUseCaseRequest): Promise<GetAdminProfileUseCaseResponse> {
    const admin = await this.adminsRepository.findById(adminId);

    if (!admin || !admin.active) {
      throw new ResourceNotFoundError();
    }

    return { admin };
  }
}
