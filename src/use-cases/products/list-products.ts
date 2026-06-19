import type {
  ProductListResult,
  ProductsRepository,
} from "@/repositories/products-repository";

interface ListProductsUseCaseRequest {
  categoryId?: number;
  q?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}

interface ListProductsUseCaseResponse {
  result: ProductListResult;
}

export class ListProductsUseCase {
  constructor(private productsRepository: ProductsRepository) {}

  async execute({
    categoryId,
    q,
    active,
    page = 1,
    limit = 20,
  }: ListProductsUseCaseRequest): Promise<ListProductsUseCaseResponse> {
    const result = await this.productsRepository.list({
      categoryId,
      q,
      active,
      page,
      limit,
    });

    return { result };
  }
}
