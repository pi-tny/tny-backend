import type { Category } from "../../../generated/prisma";
import type { CategoriesRepository } from "@/repositories/categories-repository";

interface CreateCategoryUseCaseRequest {
  name: string;
  description?: string | null;
}

interface CreateCategoryUseCaseResponse {
  category: Category;
}

export class CreateCategoryUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute(
    _request: CreateCategoryUseCaseRequest,
  ): Promise<CreateCategoryUseCaseResponse> {
    // RED stub — not implemented yet.
    return { category: { id: 0, name: "", description: null } };
  }
}
