import type {
  ProductSummary,
  ProductsRepository,
} from "@/repositories/products-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface GetRelatedProductsUseCaseRequest {
  id: number;
  limit?: number;
}

interface GetRelatedProductsUseCaseResponse {
  products: ProductSummary[];
}

export class GetRelatedProductsUseCase {
  constructor(private productsRepository: ProductsRepository) {}

  async execute({
    id,
    limit = 4,
  }: GetRelatedProductsUseCaseRequest): Promise<GetRelatedProductsUseCaseResponse> {
    const exists = await this.productsRepository.exists(id);

    if (!exists) {
      throw new ResourceNotFoundError();
    }

    const products = await this.productsRepository.findRelated(id, limit);

    return { products };
  }
}
