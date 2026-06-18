import type { CategoriesRepository } from "@/repositories/categories-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface DeleteCategoryUseCaseRequest {
  id: number;
}

export class DeleteCategoryUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({ id }: DeleteCategoryUseCaseRequest): Promise<void> {
    const deleted = await this.categoriesRepository.delete(id);

    if (!deleted) {
      throw new ResourceNotFoundError();
    }
  }
}
