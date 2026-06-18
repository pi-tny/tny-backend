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

  async execute({
    name,
    description,
  }: CreateCategoryUseCaseRequest): Promise<CreateCategoryUseCaseResponse> {
    const category = await this.categoriesRepository.create({
      name,
      description: description ?? null,
    });

    return { category };
  }
}
