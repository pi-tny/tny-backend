import type { VariantsRepository } from "@/repositories/variants-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface DeleteVariantUseCaseRequest {
  id: number;
}

export class DeleteVariantUseCase {
  constructor(private variantsRepository: VariantsRepository) {}

  async execute({ id }: DeleteVariantUseCaseRequest): Promise<void> {
    const deleted = await this.variantsRepository.delete(id);
    if (!deleted) {
      throw new ResourceNotFoundError();
    }
  }
}
