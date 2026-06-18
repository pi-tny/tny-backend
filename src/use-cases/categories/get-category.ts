import type { Category } from "../../../generated/prisma";
import type { CategoriesRepository } from "@/repositories/categories-repository";

interface GetCategoryUseCaseRequest {
  id: number;
}

interface GetCategoryUseCaseResponse {
  category: Category;
}

export class GetCategoryUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute(
    _request: GetCategoryUseCaseRequest,
  ): Promise<GetCategoryUseCaseResponse> {
    // RED stub — not implemented yet.
    return { category: { id: 0, name: "", description: null } };
  }
}
