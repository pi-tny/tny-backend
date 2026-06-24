import type {
  CategoriesRepository,
  CategoryListResult,
} from "@/repositories/categories-repository";

interface ListCategoriesUseCaseRequest {
  page?: number;
  limit?: number;
}

interface ListCategoriesUseCaseResponse {
  result: CategoryListResult;
}

export class ListCategoriesUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    page = 1,
    limit = 20,
  }: ListCategoriesUseCaseRequest = {}): Promise<ListCategoriesUseCaseResponse> {
    const result = await this.categoriesRepository.findMany({ page, limit });
    return { result };
  }
}
