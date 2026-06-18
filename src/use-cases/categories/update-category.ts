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

  async execute({
    id,
    name,
    description,
  }: UpdateCategoryUseCaseRequest): Promise<UpdateCategoryUseCaseResponse> {
    const category = await this.categoriesRepository.update(id, {
      name,
      description: description ?? null,
    });

    if (!category) {
      throw new ResourceNotFoundError();
    }

    return { category };
  }
}
