import type { LeadsRepository } from "@/repositories/leads-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface DeleteLeadUseCaseRequest {
  id: number;
}

export class DeleteLeadUseCase {
  constructor(private leadsRepository: LeadsRepository) {}

  async execute({ id }: DeleteLeadUseCaseRequest): Promise<void> {
    const deleted = await this.leadsRepository.delete(id);
    if (!deleted) {
      throw new ResourceNotFoundError();
    }
  }
}
