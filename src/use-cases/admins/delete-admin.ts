import type { AdminsRepository } from "@/repositories/admins-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface DeleteAdminUseCaseRequest {
  id: number;
}

export class DeleteAdminUseCase {
  constructor(private adminsRepository: AdminsRepository) {}

  async execute({ id }: DeleteAdminUseCaseRequest): Promise<void> {
    const deleted = await this.adminsRepository.delete(id);
    if (!deleted) {
      throw new ResourceNotFoundError();
    }
  }
}
