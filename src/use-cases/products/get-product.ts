import type {
  ProductDetail,
  ProductsRepository,
} from "@/repositories/products-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface GetProductUseCaseRequest {
  id: number;
  includeInactive?: boolean;
}

interface GetProductUseCaseResponse {
  product: ProductDetail;
}

export class GetProductUseCase {
  constructor(private productsRepository: ProductsRepository) {}

  async execute({
    id,
    includeInactive = false,
  }: GetProductUseCaseRequest): Promise<GetProductUseCaseResponse> {
    const product = await this.productsRepository.findDetail(
      id,
      includeInactive,
    );

    if (!product) {
      throw new ResourceNotFoundError();
    }

    return { product };
  }
}
