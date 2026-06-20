import type {
  ProductListResult,
  ProductSort,
  ProductsRepository,
} from "@/repositories/products-repository";

interface ListProductsUseCaseRequest {
  categoryId?: number;
  q?: string;
  active?: boolean;
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  inStock?: boolean;
  sort?: ProductSort;
  page?: number;
  limit?: number;
}

interface ListProductsUseCaseResponse {
  result: ProductListResult;
}

export class ListProductsUseCase {
  constructor(private productsRepository: ProductsRepository) {}

  async execute({
    page = 1,
    limit = 20,
    sort = "newest",
    ...filters
  }: ListProductsUseCaseRequest): Promise<ListProductsUseCaseResponse> {
    const result = await this.productsRepository.list({
      ...filters,
      sort,
      page,
      limit,
    });

    return { result };
  }
}
