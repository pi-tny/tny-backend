import type { Category } from "../../../generated/prisma";
import type { CategoriesRepository } from "@/repositories/categories-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface UpdateCategoryUseCaseRequest {
  id: number;
  name: string;
  description?: string | null;
}

interface UpdateCategoryUseCaseResponse {
  category: Category;
}

export class UpdateCategoryUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute(
    _request: UpdateCategoryUseCaseRequest,
  ): Promise<UpdateCategoryUseCaseResponse> {
    // RED stub — not implemented yet.
    throw new ResourceNotFoundError();
  }
}
