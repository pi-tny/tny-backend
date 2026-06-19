import type { Category } from "../../../generated/prisma";
import type { ProductsRepository } from "@/repositories/products-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface SetProductCategoriesUseCaseRequest {
  id: number;
  categoryIds: number[];
}

interface SetProductCategoriesUseCaseResponse {
  categories: Category[];
}

export class SetProductCategoriesUseCase {
  constructor(private productsRepository: ProductsRepository) {}

  async execute({
    id,
    categoryIds,
  }: SetProductCategoriesUseCaseRequest): Promise<SetProductCategoriesUseCaseResponse> {
    const categories = await this.productsRepository.setCategories(
      id,
      categoryIds,
    );

    if (!categories) {
      throw new ResourceNotFoundError();
    }

    return { categories };
  }
}
