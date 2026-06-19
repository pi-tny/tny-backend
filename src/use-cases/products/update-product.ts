import type {
  ProductDetail,
  ProductsRepository,
} from "@/repositories/products-repository";
import { ProductSkuAlreadyExistsError } from "@/use-cases/errors/product-sku-already-exists-error";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface UpdateProductUseCaseRequest {
  id: number;
  sku?: string;
  name?: string;
  description?: string;
  price?: number;
  promotional_price?: number | null;
  active?: boolean;
  category_ids?: number[];
}

interface UpdateProductUseCaseResponse {
  product: ProductDetail;
}

export class UpdateProductUseCase {
  constructor(private productsRepository: ProductsRepository) {}

  async execute({
    id,
    ...data
  }: UpdateProductUseCaseRequest): Promise<UpdateProductUseCaseResponse> {
    if (data.sku !== undefined) {
      const existing = await this.productsRepository.findBySku(data.sku);
      if (existing && existing.id !== id) {
        throw new ProductSkuAlreadyExistsError();
      }
    }

    const product = await this.productsRepository.update(id, data);

    if (!product) {
      throw new ResourceNotFoundError();
    }

    return { product };
  }
}
