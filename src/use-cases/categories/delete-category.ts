import type { CategoriesRepository } from "@/repositories/categories-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface DeleteCategoryUseCaseRequest {
  id: number;
}

export class DeleteCategoryUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute(_request: DeleteCategoryUseCaseRequest): Promise<void> {
    // RED stub — not implemented yet.
  }
}
