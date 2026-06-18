import type { Category } from "../../../generated/prisma";
import type { CategoriesRepository } from "@/repositories/categories-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface GetCategoryUseCaseRequest {
  id: number;
}

interface GetCategoryUseCaseResponse {
  category: Category;
}

export class GetCategoryUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    id,
  }: GetCategoryUseCaseRequest): Promise<GetCategoryUseCaseResponse> {
    const category = await this.categoriesRepository.findById(id);

    if (!category) {
      throw new ResourceNotFoundError();
    }

    return { category };
  }
}
